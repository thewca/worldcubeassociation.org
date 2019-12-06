# frozen_string_literal: true

module ResultsValidators
  class EventsRoundsValidator < GenericValidator
    CHOOSE_MAIN_EVENT_WARNING = "Your results do not contain results for 3x3x3 Cube. Please tell WRT in the comments that there was 'no main event' if no event was treated as the main event at the competition."\
      " Otherwise, if an event other than 3x3x3 Cube was treated as the main event, please name the main event in your comments to WRT and explain how that event was treated as the main event of the competition."
    UNEXPECTED_RESULTS_ERROR = "Unexpected results for %{event_id}. The event is present in the results but not listed as an official event."\
      " Remove the event from the results or contact the WCAT to request the event to be added to the WCA website."
    UNEXPECTED_ROUND_RESULTS_ERROR = "Unexpected results for round %{round_id}. The round is present in the results but not created on the events tab. Edit the events tab to include the round."
    MISSING_RESULTS_WARNING = "Missing results for %{event_id}. The event is not present in the results but listed as an official event."\
      " If the event was held, correct the results. If the event was not held, leave a comment about that to the WRT."
    MISSING_ROUND_RESULTS_ERROR = "Missing results for round %{round_id}. There is an additional round in the events tab that is not present in the results. Edit the events tab to remove the round."
    UNEXPECTED_COMBINED_ROUND_ERROR = "No cutoff was announced for '%{round_name}', but it has been detected as a combined round in the results. Please update the round's information in the competition's manage events page."

    @@desc = "This validator checks that all events and rounds match between what has been announced and what is present in the results. It also check for a main event and emit a warning if there is none (and if 3x3 is not in the results)."

    def validate(competition_ids: [], model: Result, results: nil)
      reset_state
      # Get all results if not provided.
      results ||= model.sorted_for_competitions(competition_ids)

      associations = {
        events: [],
        competition_events: {
          rounds: [:competition_event],
        },
      }

      results_by_competition_id = results.group_by(&:competitionId)

      competitions = Hash[
        Competition.includes(associations).where(id: results_by_competition_id.keys).map do |c|
          [c.id, c]
        end
      ]

      results_by_competition_id.each do |competition_id, results_for_comp|
        competition = competitions[competition_id]

        check_main_event(competition, results_for_comp)

        check_events_match(competition, results_for_comp)

        if competition.has_rounds?
          check_rounds_match(competition, results_for_comp)
        end
      end
      self
    end

    private

    def check_main_event(competition, results)
      unless results.map(&:eventId).uniq.include?("333")
        @warnings << ValidationWarning.new(:events, competition.id,
                                           CHOOSE_MAIN_EVENT_WARNING)
      end
    end

    def check_events_match(competition, results)
      # Check for missing/unexpected events.
      # As events must be validated by WCAT, any missing or unexpected event should lead to an error.
      expected = competition.events.map(&:id)
      real = results.map(&:eventId).uniq

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
      # This function automatically casts combined rounds to regular rounds if everyone has met the cutoff.

      expected_rounds_by_ids = Hash[competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.round_type_id}", r] }]

      expected = expected_rounds_by_ids.keys
      real = results.map { |r| "#{r.eventId}-#{r.roundTypeId}" }.uniq
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
