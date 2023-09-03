# frozen_string_literal: true

module ResultsValidators
  class EventsRoundsValidator < GenericValidator
    NOT_333_MAIN_EVENT_WARNING = "The selected main event for this competition is %{main_event_id}. " \
                                 "How was that event treated as the main event of the competition? " \
                                 "Please give WRT a brief explanation (e.g. number of rounds, prizes, declared winner of the competition, ...)."
    NO_MAIN_EVENT_WARNING = "There is no selected main event for this competition. Please let WRT know that this is correct."
    UNEXPECTED_RESULTS_ERROR = "Results are present for %{event_id}, however it is not listed as an official event. " \
                               "Please remove the event from the results or contact the WCAT to request the event to be added to the WCA website."
    UNEXPECTED_ROUND_RESULTS_ERROR = "The round %{round_id} is present in the results but was not created on the events tab. Please include the round's information in the competition's manage events page."
    MISSING_RESULTS_WARNING = "There are no results for %{event_id}, but it is listed as an official event. If the event was held, please reupload your JSON with the results included. If the event was not held, leave a comment for the WRT."
    MISSING_ROUND_RESULTS_ERROR = "There are no results for round %{round_id} but it is listed in the events tab. If this round was not held, please remove the round in the competition's manage events page."
    UNEXPECTED_COMBINED_ROUND_ERROR = "No cutoff was announced for '%{round_name}', but it has been detected as a cutoff round in the results. Please update the round's information in the competition's manage events page."

    @desc = "This validator checks that all events and rounds match between what has been announced and what is present in the results. It also check for a main event and emit a warning if there is none (and if 3x3 is not in the results)."

    def self.has_automated_fix?
      false
    end

    def competition_associations
      {
        events: [],
        competition_events: {
          rounds: [:competition_event],
        },
      }
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        results_for_comp = competition_data.results

        check_main_event(competition)

        check_events_match(competition, results_for_comp)

        if competition.has_rounds?
          check_rounds_match(competition, results_for_comp)
        end
      end
    end

    private

      def check_main_event(competition)
        if competition.main_event
          if competition.main_event_id != "333"
            @warnings << ValidationWarning.new(:events, competition.id,
                                               NOT_333_MAIN_EVENT_WARNING,
                                               main_event_id: competition.main_event_id)
          end
        else
          @warnings << ValidationWarning.new(:events, competition.id,
                                             NO_MAIN_EVENT_WARNING)
        end
      end

      def check_events_match(competition, results)
        # Check for missing/unexpected events.
        # As events must be validated by WCAT, any missing or unexpected event should lead to an error.
        expected = competition.events.map(&:id)
        real = results.map(&:event_id).uniq

        (real - expected).each do |event_id|
          @errors << ValidationError.new(:events, competition.id,
                                         UNEXPECTED_RESULTS_ERROR,
                                         event_id: event_id)
        end

        (expected - real).each do |event_id|
          @warnings << ValidationWarning.new(:events, competition.id,
                                             MISSING_RESULTS_WARNING,
                                             event_id: event_id)
        end
      end

      def check_rounds_match(competition, results)
        # Check that rounds match what was declared.
        # This function automatically casts cutoff rounds to regular rounds if everyone has met the cutoff.

        expected_rounds_by_ids = competition.competition_events.map(&:rounds).flatten.to_h { |r| ["#{r.event.id}-#{r.round_type_id}", r] }

        expected = expected_rounds_by_ids.keys
        real = results.map { |r| "#{r.event_id}-#{r.round_type_id}" }.uniq
        unexpected = real - expected
        missing = expected - real

        missing.each do |round_id|
          event_id, round_type_id = round_id.split("-")
          equivalent_round_id = "#{event_id}-#{RoundType.toggle_cutoff(round_type_id)}"
          if unexpected.include?(equivalent_round_id)
            unexpected.delete(equivalent_round_id)
            round = expected_rounds_by_ids[round_id]
            unless round.round_type.combined?
              @errors << ValidationError.new(:rounds, competition.id,
                                             UNEXPECTED_COMBINED_ROUND_ERROR,
                                             round_name: round.name)
            end
          else
            @errors << ValidationError.new(:rounds, competition.id,
                                           MISSING_ROUND_RESULTS_ERROR,
                                           round_id: round_id)
          end
        end
        unexpected.each do |round_id|
          @errors << ValidationError.new(:rounds, competition.id,
                                         UNEXPECTED_ROUND_RESULTS_ERROR,
                                         round_id: round_id)
        end
      end
  end
end
