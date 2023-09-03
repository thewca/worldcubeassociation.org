# frozen_string_literal: true

module ResultsValidators
  class ScramblesValidator < GenericValidator
    MISSING_SCRAMBLES_FOR_ROUND_ERROR = "[%{round_id}] Missing scrambles. Use Scrambles Matcher to add the correct scrambles to the round."
    MISSING_SCRAMBLES_FOR_COMPETITION_ERROR = "Missing scrambles for the competition. Use Scrambles Matcher to add scrambles."
    UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR = "[%{round_id}] Too many scrambles. Use Scrambles Matcher to uncheck the unused scrambles."
    MISSING_SCRAMBLES_FOR_GROUP_ERROR = "[%{round_id}] Group %{group_id}: missing scrambles, detected only %{actual} instead of %{expected}."
    MISSING_SCRAMBLES_FOR_MULTI_ERROR = "[%{round_id}] While you may have multiple groups in 3x3x3 Multi-Blind, at least one of the groups must contain scrambles for all attempts."
    MULTIPLE_FMC_GROUPS_WARNING = "[%{round_id}] There are multiple groups of FMC used. If one group of FMC was used, please use the Scrambles Matcher to uncheck the unused " \
                                  "scrambles. Otherwise, please include a comment to WRT explaining why multiple groups of FMC were used."
    WRONG_NUMBER_OF_SCRAMBLE_SETS_ERROR = "[%{round_id}] This round has a different number of scramble sets than specified on the Manage Events tab. " \
                                          "Please adjust the number of scramble sets in the Manage Events tab to the number of sets that were used."

    @desc = "This validator checks that all results have matching scrambles, and if possible, checks that the scrambles have the correct number of attempts compared to the expected round format."

    def self.has_automated_fix?
      false
    end

    def competition_associations
      {
        events: [],
        scrambles: [],
        competition_events: {
          rounds: [:competition_event],
        },
      }
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        results_for_comp = competition_data.results

        scrambles = competition.scrambles

        # Get actual round ids from results
        rounds_ids = results_for_comp.map { |r| "#{r.event_id}-#{r.round_type_id}" }.uniq

        if results_for_comp.any? && !scrambles.any?
          @errors << ValidationError.new(:scrambles, competition.id,
                                         MISSING_SCRAMBLES_FOR_COMPETITION_ERROR,
                                         competition_id: competition.id)
          next
        end

        # Group scramble by round_id
        scrambles_by_round_id = scrambles.group_by { |s| "#{s.event_id}-#{s.round_type_id}" }
        detected_scrambles_rounds_ids = scrambles_by_round_id.keys
        (rounds_ids - detected_scrambles_rounds_ids).each do |round_id|
          @errors << ValidationError.new(:scrambles, competition.id,
                                         MISSING_SCRAMBLES_FOR_ROUND_ERROR,
                                         round_id: round_id)
        end

        (detected_scrambles_rounds_ids - rounds_ids).each do |round_id|
          @errors << ValidationError.new(:scrambles, competition.id,
                                         UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR,
                                         round_id: round_id)
        end

        rounds_info_by_ids = get_rounds_info(competition, rounds_ids)

        # For existing rounds and scrambles matching expected rounds in the WCA website,
        # check that the number of scrambles match at least the number of expected scrambles.
        (detected_scrambles_rounds_ids & rounds_info_by_ids.keys).each do |round_id|
          format = rounds_info_by_ids[round_id].format
          expected_number_of_scrambles = format.expected_solve_count
          scrambles_by_group_id = scrambles_by_round_id[round_id].group_by(&:group_id)
          errors_for_round = []
          scrambles_by_group_id.each do |group_id, scrambles_for_group|
            # filter out extra scrambles
            actual_number_of_scrambles = scrambles_for_group.reject(&:is_extra).size
            if actual_number_of_scrambles < expected_number_of_scrambles
              errors_for_round << ValidationError.new(:scrambles, competition.id,
                                                      MISSING_SCRAMBLES_FOR_GROUP_ERROR,
                                                      round_id: round_id, group_id: group_id,
                                                      actual: actual_number_of_scrambles,
                                                      expected: expected_number_of_scrambles)
            end
          end
          # Check if the number of groups match the number of scramble sets specified.
          if scrambles_by_group_id.size != rounds_info_by_ids[round_id].scramble_set_count
            errors_for_round << ValidationError.new(:scrambles, competition.id,
                                                    WRONG_NUMBER_OF_SCRAMBLE_SETS_ERROR,
                                                    round_id: round_id)
          end
          if round_id.start_with?("333fm") && scrambles_by_group_id.size > 1
            @warnings << ValidationWarning.new(:scrambles, competition.id,
                                               MULTIPLE_FMC_GROUPS_WARNING,
                                               round_id: round_id)
          end
          if round_id.start_with?("333mbf")
            unless errors_for_round.size < scrambles_by_group_id.keys.size
              @errors << ValidationError.new(:scrambles, competition.id,
                                             MISSING_SCRAMBLES_FOR_MULTI_ERROR,
                                             round_id: round_id)
            end
          else
            @errors.concat(errors_for_round)
          end
        end
      end
    end
  end
end
