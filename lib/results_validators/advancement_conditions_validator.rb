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
    TOO_MANY_QUALIFIED_ERROR = :too_many_qualified_error
    NOT_ENOUGH_QUALIFIED_WARNING = :not_enough_qualified_warning
    COMPETED_NOT_QUALIFIED_ERROR = :competed_not_qualified_error
    ADVANCED_WITHOUT_VALID_RESULT_ERROR = :advanced_without_valid_result_error
    ROUND_NOT_FOUND_ERROR = :round_not_found_error

    # These are the old "(combined) qualification" and "b-final" rounds.
    # They are not taken into account in advancement conditions.
    IGNORE_ROUND_TYPES = %w[0 h b].freeze

    def self.description
      "This validator checks that advancement between rounds is correct according to the regulations."
    end

    def self.automatically_fixable?
      false
    end

    def competition_associations(check_real_results: false)
      {
        rounds: [:competition_event, :participation_source, { linked_round: [:rounds] }],
      }
    end

    # Uploaded results can lack a matching person, in which case there is no WCA ID to show.
    private def competitor_label(result)
      wca_id = result.person&.wca_id
      "#{result.name}#{" (#{wca_id})" if wca_id.present?}"
    end

    # Competitors tied with the last one a ranking or percentage condition lets through advance
    #   together with them (see ResultConditions::ResultCondition#apply), so they count as qualified
    #   as well. A "result achieved" condition is a fixed threshold that ties cannot move.
    private def number_qualified_with_ties(condition, ranked_results, number_qualified)
      return number_qualified if condition.is_a?(ResultConditions::ResultAchieved)
      return number_qualified unless number_qualified.between?(1, ranked_results.size - 1)

      last_qualified = ranked_results[number_qualified - 1]
      # Competitors without any successful attempt cannot advance, so they cannot tie for a spot either
      return number_qualified unless last_qualified.best.positive?

      number_qualified + ranked_results.drop(number_qualified).take_while { it.tied_with?(last_qualified) }.size
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        comp_start_date = competition.start_date

        results_by_event_id = competition_data.results.group_by(&:event_id)
        results_by_event_id.each do |event_id, results_for_event|
          results_by_round_id = results_for_event.group_by(&:round_id)

          # We are filtering out H2H finals as their results are loaded via a different process until we transition
          # all results to be loaded via the live_results/live_attempts pipeline. See #13200 for more information.
          rounds_without_deprecated_types = competition.rounds
                                                       .filter { it.event_id == event_id }
                                                       .reject { IGNORE_ROUND_TYPES.include?(it.round_type_id) }
                                                       .reject(&:is_h2h_mock?)

          rounds_without_deprecated_types.each do |round|
            results = results_by_round_id[round.id]
            # Rounds without any results are reported by the EventsRoundsValidator
            next if results.blank?

            number_of_people_in_round = results.size
            remaining_number_of_rounds = round.total_number_of_rounds - round.number

            if number_of_people_in_round <= 7 && remaining_number_of_rounds.positive?
              # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
              @errors << ValidationError.new(REGULATION_9M3_ERROR,
                                             :rounds, competition.id,
                                             round_id: round.human_id)
            end

            if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
              # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(REGULATION_9M2_ERROR,
                                             :rounds, competition.id,
                                             round_id: round.human_id)
            end

            if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
              # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most two subsequent rounds.
              @errors << ValidationError.new(REGULATION_9M1_ERROR,
                                             :rounds, competition.id,
                                             round_id: round.human_id)
            end

            # Initial rounds do not have any notion of "advancing" into them
            #   (ie you don't need to check the very first round or rounds linked to the very first round)
            next if round.initial_round?

            # Linked (dual) rounds are run as a single combined round, so the previous results
            # are the union of the previous round and any of its colinked rounds, keeping only
            # each competitor's best result. They are ranked from best to worst the same way
            # the PositionsValidator ranks a Dual Round.
            # Old qualification rounds are not taken into account, as competitors could be seeded past them.
            previous_round_ids = round.participation_source.rounds
                                      .reject { IGNORE_ROUND_TYPES.include?(it.round_type_id) }
                                      .pluck(:id)
            previous_results = previous_round_ids
                               .flat_map { |id| results_by_round_id[id] || [] }
                               .group_by(&:person_id)
                               .map { |_, person_results| person_results.min_by { ValidatorData.ranking_key(it) } }
                               .sort_by { ValidatorData.ranking_key(it) }
            number_of_people_in_previous_round = previous_results.size
            # Nothing to check against: the previous round is either an old qualification round,
            #   or has no results at all, which the EventsRoundsValidator reports
            next if number_of_people_in_previous_round.zero?

            # https://www.worldcubeassociation.org/regulations/#9p4: Regardless of any participation condition,
            #   competitors need a successful result in order to advance. Since we keep each competitor's best
            #   result, it is successful whenever any of their results in a Dual Round is.
            # Until 2009, competitors could be admitted directly into subsequent rounds under
            #   special circumstances, so this only applies to modern competitions.
            if comp_start_date >= Date.new(2009, 1, 1)
              previous_results_by_person_id = previous_results.index_by(&:person_id)
              people_without_valid_result = results.filter_map do |result|
                competitor_label(result) unless previous_results_by_person_id[result.person_id]&.best&.positive?
              end
              if people_without_valid_result.any?
                @errors << ValidationError.new(ADVANCED_WITHOUT_VALID_RESULT_ERROR,
                                               :rounds, competition.id,
                                               round_id: round.human_id,
                                               ids: people_without_valid_result.join(","))
              end
            end

            condition = round.participation_condition
            # Historic data may carry a "result achieved" condition without a concrete value,
            #   which leaves nothing to check against.
            condition = nil if condition.is_a?(ResultConditions::ResultAchieved) && condition.value.nil?

            # Check that no one proceeded if they shouldn't have
            if condition.instance_of? ResultConditions::ResultAchieved
              current_persons = results.map(&:person_id)
              # The condition requires a result strictly better than its value,
              #   just like ResultConditions::ResultAchieved#max_advancing
              scope_column = condition.scope == "single" ? :best : :average
              people_over_condition = previous_results.filter do |r|
                scope_result = r.send(scope_column)
                # Competitors without any successful attempt are covered by the 9p4 check above
                current_persons.include?(r.person_id) && r.best.positive? &&
                  (scope_result <= 0 || scope_result >= condition.value)
              end.map { competitor_label(it) }
              if people_over_condition.any?
                @errors << ValidationError.new(COMPETED_NOT_QUALIFIED_ERROR,
                                               :rounds, competition.id,
                                               round_id: round.human_id,
                                               ids: people_over_condition.join(","),
                                               condition: round.participation_condition_to_desc)
              end
            end

            # Dual Rounds per https://www.worldcubeassociation.org/regulations/#9v5 do not need checks
            #   on their advancement criteria, because everyone will advance anyways (and that's fine)
            is_within_dual_round = round.linked_round.present? && round != round.linked_round.first_round_in_link

            # Article 9p, since July 20, 2006 until April 13, 2010
            if comp_start_date.between?(Date.new(2006, 7, 20), Date.new(2010, 4, 13))
              if number_of_people_in_round >= number_of_people_in_previous_round
                @errors << ValidationError.new(OLD_REGULATION_9P_ERROR,
                                               :rounds, competition.id,
                                               round_id: round.human_id)
              end
            elsif !is_within_dual_round
              max_advancing = 3 * number_of_people_in_previous_round / 4
              # Article 9p1, since April 14, 2010
              # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
              if number_of_people_in_round > max_advancing
                @errors << ValidationError.new(REGULATION_9P1_ERROR,
                                               :rounds, competition.id,
                                               round_id: round.human_id)
              end
              if condition.present?
                theoretical_number_of_people = condition.max_advancing(previous_results)
                qualified_number_of_people = number_qualified_with_ties(condition, previous_results, theoretical_number_of_people)
                if number_of_people_in_round > qualified_number_of_people
                  @errors << ValidationError.new(TOO_MANY_QUALIFIED_ERROR,
                                                 :rounds, competition.id,
                                                 round_id: round.human_id,
                                                 actual: number_of_people_in_round,
                                                 expected: qualified_number_of_people,
                                                 condition: round.participation_condition_to_desc)
                end
                if theoretical_number_of_people > max_advancing
                  @errors << ValidationError.new(ROUND_9P1_ERROR,
                                                 :rounds, competition.id,
                                                 round_id: round.human_id,
                                                 condition: round.participation_condition_to_desc)
                end
                # Competitors without any successful attempt cannot advance, whatever the condition allows
                attainable_number_of_people = [theoretical_number_of_people, previous_results.count { it.best.positive? }].min
                # This comes from https://github.com/thewca/worldcubeassociation.org/issues/5587
                if attainable_number_of_people - number_of_people_in_round >= 3 &&
                   number_of_people_in_round <= 0.8 * attainable_number_of_people
                  @warnings << ValidationWarning.new(NOT_ENOUGH_QUALIFIED_WARNING,
                                                     :rounds, competition.id,
                                                     round_id: round.human_id,
                                                     expected: attainable_number_of_people,
                                                     actual: number_of_people_in_round)
                end
              end
            end
          end
        end
      end
    end
  end
end
