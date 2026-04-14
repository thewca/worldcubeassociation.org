# frozen_string_literal: true

module Live
  module Advancing
    # Port from https://github.com/thewca/wca-live/blob/main/lib/wca_live/scoretaking/advancing.ex#L143
    # Basically this just removes the number one placed competitor and then sees who of the non-advancing
    # competitors would make it if that competitor got dnf
    def self.next_advancing_without(live_results, competitor_being_quit, round)
      already_quit_ids = live_results.quit.pluck(:id)

      first_advancing = live_results.advancing.first

      candidate_ids = live_results.not_advancing.not_quit.pluck(:id)

      return [] if candidate_ids.empty?

      quit_result_ids = live_results.where(registration_id: competitor_being_quit).pluck(:id)
      ignored_ids = [first_advancing.id] | quit_result_ids | already_quit_ids

      advancement_determining = live_results
                                .where.not(id: ignored_ids)

      # Eager load associations to avoid N+1 on potential_solve_time
      loaded_results = advancement_determining.includes(:live_attempts).to_a

      # Assume that everyone who quit got dnf
      worst_results = Array.new(ignored_ids.length) { LiveResult.build(round: round, best: LiveResult::WORST_POSSIBLE_SCORE, average: LiveResult::WORST_POSSIBLE_SCORE) }
      results_with_worst = (loaded_results + worst_results).sort_by(&:values_for_sorting)

      hypothetically_advancing_ids = round.next_round.participation_condition.apply(results_with_worst).pluck(:id)

      live_results.where(id: hypothetically_advancing_ids & candidate_ids)
    end

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
