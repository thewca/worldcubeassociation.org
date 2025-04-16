# frozen_string_literal: true

module ResultsValidators
  class AdvancementConditionsValidator < GenericValidator
    # PV: There used to be an error for regulation 9M, but now all results
    # must belong to a round, and rails validations make sure the total
    # number of rounds is <= 4, and that each round number is unique.
    REGULATION_9M1_ERROR = :regulation_9m1_error
    REGULATION_9M2_ERROR = :regulation_9m2_error
    REGULATION_9M3_ERROR = :regulation_9m3_error
    REGULATION_9P1_ERROR = :regulation_9p1_error
    OLD_REGULATION_9P_ERROR = :no_competitor_eliminated_error
    ROUND_9P1_ERROR = :less_than_twenty_five_percent_eliminated_error
    TOO_MANY_QUALIFIED_WARNING = :too_many_qualified_warning
    NOT_ENOUGH_QUALIFIED_WARNING = :not_enough_qualified_warning
    COMPETED_NOT_QUALIFIED_ERROR = :competed_not_qualified_error
    ROUND_NOT_FOUND_ERROR = :round_not_found_error

    # These are the old "(combined) qualification" and "b-final" rounds.
    # They are not taken into account in advancement conditions.
    IGNORE_ROUND_TYPES = ["0", "h", "b"].freeze

    def self.description
      "This validator checks that advancement between rounds is correct according to the regulations."
    end

    def self.automatically_fixable?
      false
    end

    def competition_associations
      {
        rounds: [],
      }
    end

    def run_validation(validator_data)
      ordered_round_type_ids = RoundType.order(:rank).all.map(&:id)

      validator_data.each do |competition_data|
        competition = competition_data.competition
        comp_start_date = competition.start_date

        results_by_event_id = competition_data.results.group_by(&:eventId)
        results_by_event_id.each do |event_id, results_for_event|
          results_by_round_type_id = results_for_event.group_by(&:roundTypeId)

          round_types_in_results = results_by_round_type_id.keys.reject do |round_type_id|
            IGNORE_ROUND_TYPES.include?(round_type_id)
          end

          remaining_number_of_rounds = round_types_in_results.size
          previous_round_type_id = nil

          (ordered_round_type_ids & round_types_in_results).each do |round_type_id|
            remaining_number_of_rounds -= 1
            number_of_people_in_round = results_by_round_type_id[round_type_id].size
            round_id = "#{event_id}-#{round_type_id}"
            if number_of_people_in_round <= 7 && remaining_number_of_rounds > 0
              # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
              @errors << ValidationError.new(REGULATION_9M3_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
              # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(REGULATION_9M2_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
              # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(REGULATION_9M1_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_id)
            end

            # Check for the number of qualified competitors (only if we are not
            # in a first round).
            if previous_round_type_id
              # Get the actual Round from the website: they are populated for all
              # competitions and we can check both what actually happens and what
              # was set to happen.
              previous_round = competition.find_round_for(event_id, previous_round_type_id)

              # It can happen that the WCIF contains rounds which have been deleted on the WCA website.
              # Most famously, this occurs when the organizers planned with four rounds but less than 100 competitors
              # sign up and they don't realize it immediately. Then, the competition proceeds with four rounds but
              # upon results submission the final round is deleted from the competition_events table.
              if previous_round.present?
                previous_results = results_by_round_type_id[previous_round_type_id]
                number_of_people_in_previous_round = previous_results.size
                condition = previous_round.advancement_condition

                # Check that no one proceeded if they shouldn't have
                if condition.instance_of? AdvancementConditions::AttemptResultCondition
                  current_persons = results_by_round_type_id[round_type_id].map(&:wca_id)
                  people_over_condition = previous_results.filter do |r|
                    sort_by_column = r.format.sort_by == "single" ? :best : :average
                    current_persons.include?(r.wca_id) && r.send(sort_by_column) > condition.attempt_result
                  end.map(&:wca_id)
                  if people_over_condition.any?
                    @errors << ValidationError.new(COMPETED_NOT_QUALIFIED_ERROR,
                                                   :rounds, competition.id,
                                                   round_id: round_id,
                                                   ids: people_over_condition.join(","),
                                                   condition: condition.to_s(previous_round))
                  end
                end

                # Article 9p, since July 20, 2006 until April 13, 2010
                if comp_start_date.between?(Date.new(2006, 7, 20), Date.new(2010, 4, 13))
                  if number_of_people_in_round >= number_of_people_in_previous_round
                    @errors << ValidationError.new(OLD_REGULATION_9P_ERROR,
                                                   :rounds, competition.id,
                                                   round_id: round_id)
                  end
                else
                  max_advancing = 3 * number_of_people_in_previous_round / 4
                  # Article 9p1, since April 14, 2010
                  # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
                  if number_of_people_in_round > max_advancing
                    @errors << ValidationError.new(REGULATION_9P1_ERROR,
                                                   :rounds, competition.id,
                                                   round_id: round_id)
                  end
                  if condition
                    theoretical_number_of_people = condition.max_advancing(previous_results)
                    if number_of_people_in_round > theoretical_number_of_people
                      @warnings << ValidationWarning.new(TOO_MANY_QUALIFIED_WARNING,
                                                         :rounds, competition.id,
                                                         round_id: round_id,
                                                         actual: number_of_people_in_round,
                                                         expected: theoretical_number_of_people,
                                                         condition: condition.to_s(previous_round))
                    end
                    if theoretical_number_of_people > max_advancing
                      @errors << ValidationError.new(ROUND_9P1_ERROR,
                                                     :rounds, competition.id,
                                                     round_id: round_id,
                                                     condition: condition.to_s(previous_round))
                    end
                    # This comes from https://github.com/thewca/worldcubeassociation.org/issues/5587
                    if theoretical_number_of_people - number_of_people_in_round >= 3 &&
                       (number_of_people_in_round / theoretical_number_of_people) <= 0.8
                      @warnings << ValidationWarning.new(NOT_ENOUGH_QUALIFIED_WARNING,
                                                         :rounds, competition.id,
                                                         round_id: round_id,
                                                         expected: theoretical_number_of_people,
                                                         actual: number_of_people_in_round)
                    end
                  end
                end
              else
                @errors << ValidationError.new(ROUND_NOT_FOUND_ERROR,
                                               :rounds, competition.id,
                                               round_id: "#{event_id}-#{previous_round_type_id}")
              end
            end

            previous_round_type_id = round_type_id
          end
        end
      end
    end
  end
end
