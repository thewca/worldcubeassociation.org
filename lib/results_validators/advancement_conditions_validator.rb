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
        rounds: [:competition_event],
      }
    end

    # Sort key matching Result.merged_dual_rounds: primary score (average or best per format,
    # with DNF/<=0 ranked worst), then best, then id. Lower sorts first (better).
    private def dual_round_sort_key(result)
      primary = result.format.sort_by == "average" ? result.average : result.best
      [primary <= 0 ? 1 : 0, primary, result.best <= 0 ? 1 : 0, result.best, result.id]
    end

    private def competitor_label(result)
      "#{result.name}#{" (#{result.wca_id})" if result.wca_id.present?}"
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        comp_start_date = competition.start_date

        results_by_event_id = competition_data.results.group_by(&:event_id)
        results_by_event_id.each do |event_id, results_for_event|
          results_by_round_id = results_for_event.group_by(&:round_id)

          event_rounds = competition.rounds
                                    .filter { it.event_id == event_id }
                                    .reject { IGNORE_ROUND_TYPES.include?(it.round_type_id) }
                                    .sort_by(&:number)

          rounds_by_id = event_rounds.index_by(&:id)
          rounds_by_linked_round_id = event_rounds.filter(&:linked_round_id).group_by(&:linked_round_id)

          # The linked rounds of a dual round are run as a single combined round per
          # https://www.worldcubeassociation.org/regulations/#9v5, so they are grouped
          # together and checked as one round.
          chunked_rounds = event_rounds.chunk_while { |a, b| a.linked_round_id.present? && a.linked_round_id == b.linked_round_id }.to_a

          chunked_rounds.each do |linked_rounds|
            # H2H rounds are not checked themselves: their results are loaded via a different
            # process until we transition all results to be loaded via the live_results/live_attempts
            # pipeline (see #13200). They still occupy a round slot, which the 9m checks below
            # account for via `total_number_of_rounds`.
            next if linked_rounds.any?(&:is_h2h_mock?)

            round_results = linked_rounds.flat_map { results_by_round_id[it.id] || [] }
            next if round_results.empty?

            round_human_id = linked_rounds.map(&:human_id).uniq.join("/")
            number_of_people_in_round = round_results.map(&:person_id).uniq.size
            # Subsequent rounds are counted in round slots, per
            # https://www.worldcubeassociation.org/regulations/#9o: a dual round counts as
            # two rounds (9o2, one slot per linked round) and an H2H round as one (9o3).
            last_round = linked_rounds.last
            remaining_number_of_rounds = last_round.total_number_of_rounds - last_round.number

            if number_of_people_in_round <= 7 && remaining_number_of_rounds.positive?
              # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
              @errors << ValidationError.new(REGULATION_9M3_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_human_id)
            end

            if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
              # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(REGULATION_9M2_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_human_id)
            end

            if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
              # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most two subsequent rounds.
              @errors << ValidationError.new(REGULATION_9M1_ERROR,
                                             :rounds, competition.id,
                                             round_id: round_human_id)
            end

            # Both linked rounds of a dual round share the same participation source and
            # condition (they describe entry into the dual round), so we read them from the first round.
            first_round = linked_rounds.first
            source_rounds = case first_round.participation_source_type
                            when "Round" then [rounds_by_id[first_round.participation_source_id]].compact
                            when "LinkedRound" then rounds_by_linked_round_id[first_round.participation_source_id] || []
                            else []
                            end
            next if source_rounds.empty?

            # Merge the source results per person, keeping only each competitor's best
            # result (mirrors Result.merged_dual_rounds).
            source_results = source_rounds
                             .flat_map { results_by_round_id[it.id] || [] }
                             .group_by(&:person_id)
                             .map { |_, person_results| person_results.min_by { dual_round_sort_key(it) } }
            number_of_people_in_source = source_results.size
            next if number_of_people_in_source.zero?

            source_result_by_person_id = source_results.index_by(&:person_id)
            round_results_by_person_id = round_results.group_by(&:person_id)

            # Regardless of any participation condition: competitors must have a
            # successful result in the source round in order to advance. Until 2009,
            # competitors could be admitted directly into subsequent rounds under
            # special circumstances, so this only applies to modern competitions.
            if comp_start_date >= Date.new(2009, 1, 1)
              people_without_valid_result = round_results_by_person_id.filter_map do |person_id, person_results|
                source_result = source_result_by_person_id[person_id]
                competitor_label(person_results.first) if source_result.nil? || !source_result.best.positive?
              end
              if people_without_valid_result.any?
                @errors << ValidationError.new(ADVANCED_WITHOUT_VALID_RESULT_ERROR,
                                               :rounds, competition.id,
                                               round_id: round_human_id,
                                               ids: people_without_valid_result.join(","))
              end
            end

            # The condition for participating in this round lives on the round itself.
            # (The legacy `advancement_condition` on the source round is only kept as a
            # backport for WCIF v1 compatibility and is deliberately not used here.)
            condition = first_round.participation_condition
            # Historic data may carry a "result achieved" condition without a concrete
            # value; there is nothing to check against in that case.
            condition = nil if condition.is_a?(ResultConditions::ResultAchieved) && condition.value.nil?

            # Check that no one proceeded if they shouldn't have
            if condition.instance_of? ResultConditions::ResultAchieved
              scope_column = condition.scope == "single" ? :best : :average
              people_over_condition = source_results.filter do |r|
                scope_result = r.send(scope_column)
                # People without any successful attempt are already flagged above.
                round_results_by_person_id.key?(r.person_id) && r.best.positive? &&
                  (scope_result <= 0 || scope_result >= condition.value)
              end.map { competitor_label(it) }
              if people_over_condition.any?
                @errors << ValidationError.new(COMPETED_NOT_QUALIFIED_ERROR,
                                               :rounds, competition.id,
                                               round_id: round_human_id,
                                               ids: people_over_condition.join(","),
                                               condition: condition.to_s(source_rounds.first))
              end
            end

            # Article 9p, since July 20, 2006 until April 13, 2010
            if comp_start_date.between?(Date.new(2006, 7, 20), Date.new(2010, 4, 13))
              if number_of_people_in_round >= number_of_people_in_source
                @errors << ValidationError.new(OLD_REGULATION_9P_ERROR,
                                               :rounds, competition.id,
                                               round_id: round_human_id)
              end
            else
              max_advancing = 3 * number_of_people_in_source / 4

              linked_rounds.each do |round|
                number_of_results_in_round = (results_by_round_id[round.id] || []).size
                # Article 9p1, since April 14, 2010
                # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
                next unless number_of_results_in_round > max_advancing

                @errors << ValidationError.new(REGULATION_9P1_ERROR,
                                               :rounds, competition.id,
                                               round_id: round.human_id)
              end

              if condition
                condition_string = condition.to_s(source_rounds.first)

                # The declared condition itself must eliminate at least 25% of the
                # source round's competitors (9p1), regardless of how many of them
                # actually continued or achieved a successful result.
                nominal_number_of_people = condition.nominal_max_advancing(source_results)
                if nominal_number_of_people > max_advancing
                  @errors << ValidationError.new(ROUND_9P1_ERROR,
                                                 :rounds, competition.id,
                                                 round_id: round_human_id,
                                                 condition: condition_string)
                end

                linked_rounds.each do |round|
                  number_of_results_in_round = (results_by_round_id[round.id] || []).size
                  next unless number_of_results_in_round > nominal_number_of_people

                  @errors << ValidationError.new(TOO_MANY_QUALIFIED_ERROR,
                                                 :rounds, competition.id,
                                                 round_id: round.human_id,
                                                 actual: number_of_results_in_round,
                                                 expected: nominal_number_of_people,
                                                 condition: condition_string)
                end

                # Competitors declining to continue is normal, but a large shortfall
                # relative to what the condition permits deserves a comment.
                # This comes from https://github.com/thewca/worldcubeassociation.org/issues/5587
                theoretical_number_of_people = condition.max_advancing(source_results)
                if theoretical_number_of_people - number_of_people_in_round >= 3 &&
                   number_of_people_in_round <= 0.8 * theoretical_number_of_people
                  @warnings << ValidationWarning.new(NOT_ENOUGH_QUALIFIED_WARNING,
                                                     :rounds, competition.id,
                                                     round_id: round_human_id,
                                                     expected: theoretical_number_of_people,
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
