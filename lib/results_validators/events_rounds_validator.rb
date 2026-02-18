# frozen_string_literal: true

module ResultsValidators
  class EventsRoundsValidator < GenericValidator
    NOT_333_MAIN_EVENT_WARNING = :not_333_main_event_warning
    NO_MAIN_EVENT_WARNING = :no_main_event_warning
    MISSING_RESULTS_WARNING = :missing_results_warning
    MISSING_ROUND_RESULTS_ERROR = :missing_round_results_error

    def self.description
      "This validator checks that all events and rounds match between what has been announced and what is present in the results. It also check for a main event and emit a warning if there is none (and if 3x3 is not in the results)."
    end

    def self.automatically_fixable?
      false
    end

    def competition_associations
      {
        events: [],
        rounds: [:competition_event],
        competition_venues: { venue_rooms: { schedule_activities: [:child_activities] } },
      }
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        results_for_comp = competition_data.results

        check_main_event(competition)

        if competition.any_rounds?
          check_events_match(competition, results_for_comp)
          check_rounds_match(competition, results_for_comp)
        end
      end
    end

    private

      def check_main_event(competition)
        # Check for the main event being 3x3x3, being the only event, or being last in the schedule
        unless competition.main_event
          @warnings << ValidationWarning.new(NO_MAIN_EVENT_WARNING, :events, competition.id)
          return
        end

        return if competition.main_event_id == "333" || competition.events.length == 1
        return if competition.main_event_last_in_schedule?

        @warnings << ValidationWarning.new(NOT_333_MAIN_EVENT_WARNING,
                                           :events, competition.id,
                                           main_event_id: competition.main_event_id)
      end

      def check_events_match(competition, results)
        # Check for events which are entirely missing results.
        # This is treated as an error, because it should never happen that you forget to hold an entire event
        #   at your competition. If there are legitimate reasons why an event couldn't take place, you *must*
        #   contact WCAT first and fix the events data through their authority. That's why it's a hard error.
        expected = competition.events.map(&:id)
        real = results.map(&:event_id).uniq

        (expected - real).each do |event_id|
          @warnings << ValidationWarning.new(MISSING_RESULTS_WARNING,
                                             :events, competition.id,
                                             event_id: event_id)
        end
      end

      def check_rounds_match(competition, results)
        # Check for rounds which are entirely missing results.
        # We are filtering out H2H finals as their results are loaded via a different process until we transition
        #   all results to be loaded via the live_results/live_attempts pipeline. See #13200 for more information.
        expected = competition.rounds.reject(&:is_h2h_mock?).map(&:human_id)
        real = results.map(&:round_human_id).uniq

        (expected - real).each do |round_id|
          @errors << ValidationError.new(MISSING_ROUND_RESULTS_ERROR,
                                         :rounds, competition.id,
                                         round_id: round_id)
        end
      end
  end
end
