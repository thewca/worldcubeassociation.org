# frozen_string_literal: true

module Live
  module Advancing
    def self.recompute_advancing(results_per_person, results_to_update, advancement_determining_condition, can_update_advancing: true)
      results_with_potential = results_per_person.select { it.locked_by_id.nil? }.sort_by(&:potential_solve_time)

      advancing_ids = advancement_determining_condition.apply(results_with_potential).pluck(:registration_id)
      max_advancing = advancement_determining_condition.max_qualifying(results_with_potential)

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

    def self.podium_condition(round)
      ResultConditions::Ranking.new(scope: round.format.sort_by, value: 3)
    end
  end
end
