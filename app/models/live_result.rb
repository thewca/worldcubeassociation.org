# frozen_string_literal: true

class LiveResult < ApplicationRecord
  has_many :live_attempts, -> { where(replaced_by: nil).order(:attempt_number) }

  after_create :recompute_advancing
  after_update :recompute_advancing, if: :should_recompute?

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

  def best_possible_score
    1
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
      round_results = LiveResult.where(round: round)
      round_results.update_all(advancing: false)

      missing_attempts = round.total_registrations - round_results.count
      potential_results = Array.new(missing_attempts) { |i| LiveResult.build(round: round) }
      results_with_potential = (round_results.to_a + potential_results).sort_by(&:potential_score)

      # Maximum 75% as per regulations
      max_qualifying = (round_results.length * 0.75).floor

      if round.final_round?
        round_results.update_all("advancing_questionable = ranking BETWEEN 1 AND 3")
        max_clinched = 3
      else
        advancement_condition = round.advancement_condition
        if advancement_condition.is_a? AdvancementConditions::RankingCondition
          qualifying_index = [advancement_condition.level, max_qualifying].min
          round_results.update_all("advancing_questionable = ranking BETWEEN 1 AND #{qualifying_index}")
        end

        if advancement_condition.is_a? AdvancementConditions::PercentCondition
          amount_qualifying = (advancement_condition.level * round_results.length).floor
          qualifying_index = [amount_qualifying, max_qualifying].min
          round_results.update_all("advancing_questionable = ranking BETWEEN 1 AND #{qualifying_index}")
        end

        if advancement_condition.is_a? AdvancementConditions::AttemptResultCondition
          sort_by = round.format.sort_by == 'single' ? 'best' : 'average'
          people_potentially_qualifying = round_results.where("#{sort_by} > ?", advancement_condition.level)
          qualifying_index = [people_potentially_qualifying.length, max_qualifying].min
          round_results.update_all("advancing_questionable = id IN (SELECT id FROM round_results ORDER BY ranking ASC LIMIT #{qualifying_index})")
        end

        max_clinched = qualifying_index
      end

      # Determine which results would advance if everyone achieved their best possible attempt.
      advancing_ids = results_with_potential.first(max_clinched).select(&:complete?).map(&:id)

      round_results.update_all(advancing: false)
      LiveResult.where(id: advancing_ids).update_all(advancing: true)
    end
end
