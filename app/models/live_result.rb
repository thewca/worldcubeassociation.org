# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts, -> { where(replaced_by: nil).order(:attempt_number) }

  after_save :notify_users

  belongs_to :registration

  belongs_to :round

  alias_attribute :result_id, :id

  has_one :event, through: :round

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[ranking registration_id round_id best average single_record_tag average_record_tag advancing advancing_questionable entered_at entered_by_id],
    methods: %w[event_id attempts result_id],
    include: %w[],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def event_id
    event.id
  end

  def attempts
    live_attempts.order(:attempt_number)
  end

  def potential_score
    rank_by = round.format.sort_by == 'single' ? 'best' : 'average'
    complete? ? self[rank_by.to_sym] : best_possible_score
  end

  def complete?
    live_attempts.where.not(result: 0).count == round.format.expected_solve_count
  end

  private

    def compute_record_tag
      # Reset Record tag for updates
      update(single_record_tag: nil, average_record_tag: nil)

      # Taken from the v0 records controlled TODO: Refactor? Or probably recompute this on CAD run
      concise_results_date = ComputeAuxiliaryData.end_date || Date.current
      cache_key = ["records", concise_results_date.iso8601]
      all_records = Rails.cache.fetch(cache_key) do
        records = ActiveRecord::Base.connection.exec_query <<-SQL
          SELECT 'single' type, MIN(best) value, countryId country_id, eventId event_id
          FROM ConciseSingleResults
          GROUP BY countryId, eventId
          UNION ALL
          SELECT 'average' type, MIN(average) value, countryId country_id, eventId event_id
          FROM ConciseAverageResults
          GROUP BY countryId, eventId
        SQL
        records = records.to_a
        {
          world_records: records_by_event(records),
          continental_records: records.group_by { |record| Country.c_find(record["country_id"]).continentId }.transform_values!(&method(:records_by_event)),
          national_records: records.group_by { |record| record["country_id"] }.transform_values!(&method(:records_by_event)),
        }
      end

      record_levels = {
        WR: all_records[:world_records],
        CR: all_records[:continental_records][registration.user.country.continentId],
        NR: all_records[:national_records][registration.user.country.id]
      }

      record_levels.each do |tag, records|
        if records.dig(event_id, 'single')&.>= best
          update(single_record_tag: tag.to_s)
          got_record = true
        end
        if records.dig(event_id, 'average')&.>= average
          update(average_record_tag: tag.to_s)
          got_record = true
        end
        return if got_record
      end

      personal_records = { :single => registration.best_solve(event_id, 'single'), :average => registration.best_solve(event_id, 'average')}
      if personal_records[:single].time_centiseconds < best
        update(single_record_tag: 'PR')
      end
      if personal_records[:average].time_centiseconds < average
        update(average_record_tag: 'PR')
      end
    end

    def notify_users
      ActionCable.server.broadcast("results_#{round_id}", serializable_hash)
    end
end
