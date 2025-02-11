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
      LiveRecord::RECORD_SCOPES.each do |scope|
        single_record = LiveRecord.best_for(event_id, 'single', scope,
                                              country_id: (scope == 'NR' ? registration.user.country.id : nil),
                                              continent_id: (scope == 'CR' ? registration.user.country.continentId : nil))

        average_record = LiveRecord.best_for(event_id, 'average', scope,
                                               country_id: (scope == 'NR' ? registration.user.country.id : nil),
                                               continent_id: (scope == 'CR' ? registration.user.country.continentId : nil))

        if single_record.value && single_record.value <= best
          update(single_record_tag: scope)
          single_record.update(value: best, live_result: self)
          got_record = true
        end

        if average_record.value && average_record.value <= average
          update(average_record_tag: scope)
          average_record.update(value: average, live_result: self)
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
