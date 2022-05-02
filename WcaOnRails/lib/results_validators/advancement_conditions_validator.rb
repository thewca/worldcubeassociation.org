# frozen_string_literal: true

module ResultsValidators
  class AdvancementConditionsValidator < GenericValidator
    REGULATION_9M_ERROR = "Event %{event_id} has more than four rounds, which is not permitted as per Regulation 9m."
    REGULATION_9M1_ERROR = "Round %{round_id} has 99 or fewer competitors but has more than two subsequent rounds, which is not permitted as per Regulation 9m1."
    REGULATION_9M2_ERROR = "Round %{round_id} has 15 or fewer competitors but has more than one subsequent round, which is not permitted as per Regulation 9m2."
    REGULATION_9M3_ERROR = "Round %{round_id} has 7 or fewer competitors but has at least one subsequent round, which is not permitted as per Regulation 9m3."
    REGULATION_9P1_ERROR = "Round %{round_id}: Fewer than 25%% of competitors were eliminated, which is not permitted as per Regulation 9p1."
    OLD_REGULATION_9P_ERROR = "Round %{round_id}: There must be at least one competitor eliminated, which is required as per Regulation 9p (competitions before April 2010)."

    # These are the old "(combined) qualification" and "b-final" rounds.
    # They are not taken into account in advancement conditions.
    IGNORE_ROUND_TYPES = ["0", "h", "b"].freeze

    @@desc = "This validator checks that advancement between rounds is correct according to the regulations."

    def self.has_automated_fix?
      false
    end

    def validate(competition_ids: [], model: Result, results: nil)
      reset_state
      # Get all results if not provided
      results ||= model.sorted_for_competitions(competition_ids)

      results_by_competition_id = results.group_by(&:competitionId)

      competitions_start_dates = Competition.where(id: results_by_competition_id.keys).select(:id, :start_date).map do |c|
        [c.id, c.start_date]
      end.to_h

      results_by_competition_id.each do |competition_id, results_for_comp|
        comp_start_date = competitions_start_dates[competition_id]
        results_by_event_id = results_for_comp.group_by(&:eventId)
        results_by_event_id.each do |event_id, results_for_event|
          results_by_event_id[event_id] = results_for_event.group_by(&:roundTypeId)
        end
        ordered_round_type_ids = RoundType.order(:rank).all.map(&:id)
        results_by_event_id.each do |event_id, results_by_round_type_id|
          round_types_in_results = results_by_round_type_id.keys.reject do |round_type_id|
            IGNORE_ROUND_TYPES.include?(round_type_id)
          end
          remaining_number_of_rounds = round_types_in_results.size
          if remaining_number_of_rounds > 4
            # https://www.worldcubeassociation.org/regulations/#9m: Events must have at most four rounds.
            # Should not happen as we already have a validation to create rounds, but who knows...
            @errors << ValidationError.new(:rounds, competition_id,
                                           REGULATION_9M_ERROR,
                                           event_id: event_id)
          end
          number_of_people_in_previous_round = nil
          (ordered_round_type_ids & round_types_in_results).each do |round_type_id|
            remaining_number_of_rounds -= 1
            number_of_people_in_round = results_by_round_type_id[round_type_id].size
            round_id = "#{event_id}-#{round_type_id}"
            if number_of_people_in_round <= 7 && remaining_number_of_rounds > 0
              # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
              @errors << ValidationError.new(:rounds, competition_id,
                                             REGULATION_9M3_ERROR,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
              # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(:rounds, competition_id,
                                             REGULATION_9M2_ERROR,
                                             round_id: round_id)
            end
            if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
              # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most one subsequent round.
              @errors << ValidationError.new(:rounds, competition_id,
                                             REGULATION_9M1_ERROR,
                                             round_id: round_id)
            end

            # Check for the number of qualified competitors (only if we are not
            # in a first round).
            if number_of_people_in_previous_round
              # Article 9p, since July 20, 2006 until April 13, 2010
              if Date.new(2006, 7, 20) <= comp_start_date &&
                 comp_start_date <= Date.new(2010, 4, 13)
                if number_of_people_in_round >= number_of_people_in_previous_round
                  @errors << ValidationError.new(:rounds, competition_id,
                                                 OLD_REGULATION_9P_ERROR,
                                                 round_id: round_id)
                end
              else
                # Article 9p1, since April 14, 2010
                # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
                if number_of_people_in_round > 3 * number_of_people_in_previous_round / 4
                  @errors << ValidationError.new(:rounds, competition_id,
                                                 REGULATION_9P1_ERROR,
                                                 round_id: round_id)
                end
              end
            end
            number_of_people_in_previous_round = number_of_people_in_round
          end
        end
      end
      self
    end
  end
end
