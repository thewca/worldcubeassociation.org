# frozen_string_literal: true

module ResultsValidators
  class PositionsValidator < GenericValidator
    WRONG_POSITION_IN_RESULTS_ERROR = :wrong_position_in_results_error
    POSITION_FIXED_INFO = :automatically_position_fixed_info
    WRONG_GLOBAL_POSITION_IN_RESULTS_ERROR = :wrong_global_position_in_results_error
    GLOBAL_POSITION_FIXED_INFO = :automatically_global_position_fixed_info

    def self.description
      "This validator checks that positions stored in results are correct with regard to the actual results."
    end

    def self.automatically_fixable?
      true
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        # H2H positions are determined by match outcomes, not by comparing times.
        results_for_comp = competition_data.results.reject { it.round.is_h2h_mock? }

        dual_rounds, standalone_rounds = results_for_comp.group_by(&:round_human_id)
                                                         .values
                                                         .partition { it.first.round.linked_round_id.present? }

        # The validator data already sorts by average then best via ValidatorData#load_data,
        # so we simply need to check that the position stored matched the expected one.
        # A round outside a Dual Round is ranked on its own, which makes `global_pos` equal `pos`.
        standalone_rounds.each do |results_for_round|
          expected_positions(results_for_round).each do |result, expected_pos|
            check_position(competition, result, :pos, expected_pos)
            check_position(competition, result, :global_pos, expected_pos)
          end
        end

        dual_rounds.each do |results_for_round|
          expected_positions(results_for_round).each do |result, expected_pos|
            check_position(competition, result, :pos, expected_pos)
          end
        end

        # A Dual Round ranks each competitor once across all of its rounds, counting only their
        # better solve, so `global_pos` spans the whole link.
        dual_rounds.flatten.group_by { it.round.linked_round_id }.each_value do |results_for_group|
          expected_pos_by_person = expected_positions(best_result_per_person(results_for_group))
                                   .transform_keys(&:person_id)

          results_for_group.each do |result|
            check_position(competition, result, :global_pos, expected_pos_by_person.fetch(result.person_id))
          end
        end
      end
    end

    # Within a Dual Round a competitor holds one result per round but is ranked on their better
    # one, so the merged ranking is built from each competitor's best result.
    private def best_result_per_person(results)
      results.group_by(&:person_id)
             .values
             .map { |person_results| person_results.min_by { ValidatorData.ranking_key(it) } }
             .sort_by { ValidatorData.ranking_key(it) }
    end

    # Maps every result of the given ranking, which must be ordered from best to worst, to the
    # position it should hold. Tied results share a position and push the next one down.
    private def expected_positions(ranked_results)
      expected_pos = 0
      # Number of tied competitors, *without* counting the first one
      number_of_tied = 0
      last_result = nil

      ranked_results.index_with do |result|
        # Unless we find two exact same results, we increase the expected position
        tied = result.tied_with?(last_result)
        if tied
          number_of_tied += 1
        else
          expected_pos += 1
          expected_pos += number_of_tied
          number_of_tied = 0
        end
        last_result = result

        expected_pos
      end
    end

    private def check_position(competition, result, position_attribute, expected_pos)
      actual_pos = result.public_send(position_attribute)
      return if actual_pos == expected_pos

      error_id, info_id = if position_attribute == :global_pos
                            [WRONG_GLOBAL_POSITION_IN_RESULTS_ERROR, GLOBAL_POSITION_FIXED_INFO]
                          else
                            [WRONG_POSITION_IN_RESULTS_ERROR, POSITION_FIXED_INFO]
                          end

      message_args = {
        round_id: result.round_human_id,
        person_name: result.person_name,
        expected_pos: expected_pos,
        pos: actual_pos,
      }

      if @apply_fixes
        @infos << ValidationInfo.new(info_id, :results, competition.id, **message_args)
        result.update!(position_attribute => expected_pos)
      else
        @errors << ValidationError.new(error_id, :results, competition.id, **message_args)
      end
    end
  end
end
