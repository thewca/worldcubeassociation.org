# frozen_string_literal: true

module ResultsValidators
  class PositionsValidator < GenericValidator
    WRONG_POSITION_IN_RESULTS_ERROR = :wrong_position_in_results_error
    POSITION_FIXED_INFO = :automatically_position_fixed_info

    def self.description
      "This validator checks that positions stored in results are correct with regard to the actual results."
    end

    def self.automatically_fixable?
      true
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        results_for_comp = competition_data.results

        results_for_comp.group_by(&:round_human_id).each do |round_id, results_for_round|
          expected_pos = 0
          last_result = nil
          # Number of tied competitors, *without* counting the first one
          number_of_tied = 0
          results_for_round.each do |result|
            # Check for position in round
            # The validator data already sorts by average then best via ValidatorData#load_data,
            # so we simply need to check that the position stored matched the expected one

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

            if expected_pos != result.pos
              if @apply_fixes
                @infos << ValidationInfo.new(POSITION_FIXED_INFO,
                                             :results, competition.id,
                                             round_id: round_id,
                                             person_name: result.person_name,
                                             expected_pos: expected_pos,
                                             pos: result.pos)
                result.update!(pos: expected_pos)
              else
                @errors << ValidationError.new(WRONG_POSITION_IN_RESULTS_ERROR,
                                               :results, competition.id,
                                               round_id: round_id,
                                               person_name: result.person_name,
                                               expected_pos: expected_pos,
                                               pos: result.pos)
              end
            end
          end
        end
      end
    end
  end
end
