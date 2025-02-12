# frozen_string_literal: true

class LiveResult < ApplicationRecord
  BEST_POSSIBLE_SCORE = 1

  has_many :live_attempts, -> { where(replaced_by: nil).order(:attempt_number) }

  after_save :recompute_advancing, if: :should_recompute?

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
    complete? ? self[rank_by.to_sym] : BEST_POSSIBLE_SCORE
  end

  def complete?
    live_attempts.where.not(result: 0).count == round.format.expected_solve_count
  end

  private

    def should_recompute?
      saved_change_to_best? || saved_change_to_average?
    end

    def notify_users
      ActionCable.server.broadcast("results_#{round_id}", serializable_hash)
    end

    def recompute_advancing
      round_results = round.live_results
      round_results.update_all(advancing: false, advancing_questionable: false)

      missing_attempts = round.total_accepted_registrations - round_results.count
      potential_results = Array.new(missing_attempts) { |i| LiveResult.build(round: round) }
      results_with_potential = (round_results.to_a + potential_results).sort_by(&:potential_score)

      qualifying_index = round.number_of_competitors_advancing
      round_results.update_all("advancing_questionable = ranking BETWEEN 1 AND #{qualifying_index}")

      # Determine which results would advance if everyone achieved their best possible attempt.
      advancing_ids = results_with_potential.take(qualifying_index).select(&:complete?).pluck(:id)

      LiveResult.where(id: advancing_ids).update_all(advancing: true)
    end
end
