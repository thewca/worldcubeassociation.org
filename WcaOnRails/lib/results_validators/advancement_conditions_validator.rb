# frozen_string_literal: true

module ResultsValidators
  class AdvancementConditionsValidator < GenericValidator
    # PV: There used to be an error for regulation 9M, but now all results
    # must belong to a round, and rails validations make sure the total
    # number of rounds is <= 4, and that each round number is unique.
    REGULATION_9M1_ERROR = "Round %{round_id} has 99 or fewer competitors but has more than two subsequent rounds, which is not permitted as per Regulation 9m1."
    REGULATION_9M2_ERROR = "Round %{round_id} has 15 or fewer competitors but has more than one subsequent round, which is not permitted as per Regulation 9m2."
    REGULATION_9M3_ERROR = "Round %{round_id} has 7 or fewer competitors but has at least one subsequent round, which is not permitted as per Regulation 9m3."
    REGULATION_9P1_ERROR = "Round %{round_id}: Fewer than 25%% of competitors were eliminated, which is not permitted as per Regulation 9p1."
    OLD_REGULATION_9P_ERROR = "Round %{round_id}: There must be at least one competitor eliminated, which is required as per Regulation 9p (competitions before April 2010)."
    ROUND_9P1_ERROR = "Round %{round_id}: according to the advancement condition (%{condition}), fewer than 25%% of competitors would be eliminated," \
                      "which is not permitted as per Regulation 9p1. Please update the round information in the manage events page."
    TOO_MANY_QUALIFIED_WARNING = "Round %{round_id}: more competitors qualified than what the advancement condition planned (%{actual} instead of %{expected}, " \
                                 "the condition was: %{condition}). Please update the round information in the manage events page."
    NOT_ENOUGH_QUALIFIED_WARNING = "Round %{round_id}: according to the events data, at most %{expected} could have proceed, but only %{actual} competed in the round. " \
                                   "Please leave a comment about that (or fix the events data if you applied a different advancement condition)."
    COMPETED_NOT_QUALIFIED_ERROR = "Round %{round_id}: %{ids} competed but did not meet the attempt result advancement condition (%{condition}). " \
                                   "Please make sure the advancement condition reflects what was used during the competition, and remove the results if needed."

    # These are the old "(combined) qualification" and "b-final" rounds.
    # They are not taken into account in advancement conditions.
    IGNORE_ROUND_TYPES = ["0", "h", "b"].freeze

    @desc = "This validator checks that advancement between rounds is correct according to the regulations."

    def self.has_automated_fix?
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
              @errors << ValidationError.new(:rounds, competition.id,
                                             REGULATION_9M3_ERROR,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
              # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(:rounds, competition.id,
                                             REGULATION_9M2_ERROR,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
              # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(:rounds, competition.id,
                                             REGULATION_9M1_ERROR,
                                             round_id: round_id)
            end

            # Check for the number of qualified competitors (only if we are not
            # in a first round).
            if previous_round_type_id
              # Get the actual Round from the website: they are populated for all
              # competitions and we can check both what actually happens and what
              # was set to happen.
              previous_round = competition.find_round_for(event_id, previous_round_type_id)
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
                  @errors << ValidationError.new(:rounds, competition.id,
                                                 COMPETED_NOT_QUALIFIED_ERROR,
                                                 round_id: round_id,
                                                 ids: people_over_condition.join(","),
                                                 condition: condition.to_s(previous_round))
                end
              end

              # Article 9p, since July 20, 2006 until April 13, 2010
              if Date.new(2006, 7, 20) <= comp_start_date &&
                 comp_start_date <= Date.new(2010, 4, 13)
                if number_of_people_in_round >= number_of_people_in_previous_round
                  @errors << ValidationError.new(:rounds, competition.id,
                                                 OLD_REGULATION_9P_ERROR,
                                                 round_id: round_id)
                end
              else
                max_advancing = 3 * number_of_people_in_previous_round / 4
                # Article 9p1, since April 14, 2010
                # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
                if number_of_people_in_round > max_advancing
                  @errors << ValidationError.new(:rounds, competition.id,
                                                 REGULATION_9P1_ERROR,
                                                 round_id: round_id)
                end
                if condition
                  theoretical_number_of_people = condition.max_advancing(previous_results)
                  if number_of_people_in_round > theoretical_number_of_people
                    @warnings << ValidationWarning.new(:rounds, competition.id,
                                                       TOO_MANY_QUALIFIED_WARNING,
                                                       round_id: round_id,
                                                       actual: number_of_people_in_round,
                                                       expected: theoretical_number_of_people,
                                                       condition: condition.to_s(previous_round))
                  end
                  if theoretical_number_of_people > max_advancing
                    @errors << ValidationError.new(:rounds, competition.id,
                                                   ROUND_9P1_ERROR,
                                                   round_id: round_id,
                                                   condition: condition.to_s(previous_round))
                  end
                  # This comes from https://github.com/thewca/worldcubeassociation.org/issues/5587
                  if theoretical_number_of_people - number_of_people_in_round >= 3 &&
                     (number_of_people_in_round / theoretical_number_of_people) <= 0.8
                    @warnings << ValidationWarning.new(:rounds, competition.id,
                                                       NOT_ENOUGH_QUALIFIED_WARNING,
                                                       round_id: round_id,
                                                       expected: theoretical_number_of_people,
                                                       actual: number_of_people_in_round)
                  end
                end
              end
            end

            previous_round_type_id = round_type_id
          end
        end
      end
    end
  end
end
