# frozen_string_literal: true

module Live
  module Advancing
    def self.recompute_advancing(advancement_source, can_update_advancing: true)
      results_with_potential = advancement_source.advancement_results.reject(&:locked?).sort_by(&:potential_solve_time)

      advancement_determining_condition = if advancement_source.final_round?
                                            Live::Advancing.podium_condition(advancement_source.ranking_format)
                                          else
                                            advancement_source.target_participation_condition
                                          end

      advancing_ids = advancement_determining_condition.apply(results_with_potential).pluck(:registration_id)
      max_advancing = advancement_determining_condition.max_qualifying(results_with_potential)

      results_to_update = advancement_source.live_results.globally_ranked.not_locked

      if can_update_advancing && advancing_ids.any?
        results_to_update.update_all(
          ["advancing = (registration_id IN (?)), advancing_questionable = (global_pos <= ?)", advancing_ids, max_advancing],
        )
      else
        results_to_update.update_all(
          ["advancing = FALSE, advancing_questionable = (global_pos <= ?)", max_advancing],
        )
      end
    end

    def self.podium_condition(format)
      ResultConditions::Ranking.new(scope: format.sort_by, value: 3)
    end
  end
end
