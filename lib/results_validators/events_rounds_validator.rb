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
        if competition.main_event
          if competition.main_event_id != "333" && competition.events.length > 1
            @warnings << ValidationWarning.new(NOT_333_MAIN_EVENT_WARNING,
                                               :events, competition.id,
                                               main_event_id: competition.main_event_id)
          end
        else
          @warnings << ValidationWarning.new(NO_MAIN_EVENT_WARNING,
                                             :events, competition.id)
        end
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
        # This is treated as a warning because under certain circumstances, you can plan for a round but not hold it.
        #   The most "popular" reason for this is Regulation 9m (https://www.worldcubeassociation.org/regulations/#9m)
        #   which effectively means that you wanted to hold three rounds of 3BLD but not enough people showed up.
        # This scenario happens often enough that we allow Delegates to fix it "by themselves"
        #   without WCAT intervention. That's why it's only a soft warning (as opposed to events being a hard error).
        expected = competition.rounds.reject { it.is_h2h_mock == true }.map(&:human_id)
        real = results.map(&:round_human_id).uniq

        (expected - real).each do |round_id|
          @errors << ValidationError.new(MISSING_ROUND_RESULTS_ERROR,
                                         :rounds, competition.id,
                                         round_id: round_id)
        end
      end
  end
end
