# frozen_string_literal: true

module ResultsValidators
  class IndividualResultsValidator < GenericValidator
    MBF_RESULT_OVER_TIME_LIMIT_WARNING = "[%{round_id}] Result '%{result}' for %{person_name} is over the time limit. Please ensure this is due to time penalties before sending the results, or fix the result to DNF."

    RESULT_AFTER_DNS_WARNING = "[%{round_id}] %{person_name} has at least one DNS result followed by a valid result. Please ensure it is indeed a DNS and if so, explain what happened to WRT."
    SIMILAR_RESULTS_WARNING = "[%{round_id}] Results for %{person_name} are similar to the results for %{similar_person_name}. Please ensure that these results are correctly recorded for both competitors."

    MET_CUTOFF_MISSING_RESULTS_ERROR = "[%{round_id}] %{person_name} met the cutoff but is missing results for the second phase of the round. The cutoff was %{cutoff}."
    DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR = "[%{round_id}] %{person_name} has at least one result for the second phase of the round but didn't meet the cutoff. The cutoff was %{cutoff}."
    WRONG_ATTEMPTS_FOR_CUTOFF_ERROR = "[%{round_id}] %{person_name} is missing at least one attempt for the cutoff phase. " \
                                      "Please edit the result to include the missing attempt(s) or update the round's information in the competition's Manage Events page."
    MISMATCHED_RESULT_FORMAT_ERROR = "[%{round_id}] Results for %{person_name} are in the wrong format: expected %{expected_format}, but got %{format}."
    RESULT_OVER_TIME_LIMIT_ERROR = "[%{round_id}] At least one result for %{person_name} is over the time limit for the round, which is %{time_limit} per attempt. All solves over the time limit must be changed to DNF."
    RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR = "[%{round_ids}] The sum of results for %{person_name} is over the cumulative time limit, which was %{time_limit}."
    NO_ROUND_INFORMATION_WARNING = "[%{round_id}] There is no information about the cutoff and time limit for this round. These validations have been skipped. Please update the round's information in the competition's Manage Events page."
    UNDEF_TL_WARNING = "[%{round_id}] The time limit for this round is undefined, time limit validations have been skipped. This is expected only for competitions before 2013."
    SUSPICIOUS_DNF_WARNING = "[%{round_ids}] The round has a cumulative time limit, and extrapolating based on %{person_name}'s successful solves, they would have had very little time left for at least one of their DNFs. " \
                             "Please ensure that every DNF and DNS is indeed correct. If the competitor did not start an attempt or did not have any remaining time before starting an attempt, it must be entered as DNS."

    # Miscelaneous errors
    MISSING_CUMULATIVE_ROUND_ID_ERROR = "[%{original_round_id}] Unable to find the round %{wcif_id} for the cumulative time limit specified in the WCIF. " \
                                        "Please go to the competition's Manage Events page and remove %{wcif_id} from the cumulative time limit for %{original_round_id}. WST knows about this bug (GitHub issue #3254)."

    @desc = "This validator checks that all results respect the format, time limit, and cutoff information if available. It also looks for similar results within the round."

    def self.has_automated_fix?
      false
    end

    def competition_associations
      {
        events: [],
        competition_events: {
          rounds: {
            # That's a weird association, but that's needed for cumulative rounds...
            competition: { rounds: [:competition_event] },
            competition_event: [],
          },
        },
      }
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition

        results_for_comp = competition_data.results
        results_by_round_id = results_for_comp.group_by { |r| "#{r.eventId}-#{r.roundTypeId}" }

        rounds_info_by_round_id = get_rounds_info(competition, results_by_round_id.keys)
        results_by_round_id.each do |round_id, results_for_round|
          # get cutoff and time limit
          round_info = rounds_info_by_round_id[round_id]

          unless round_info
            # This situation may happen with "old" competitions
            @warnings << ValidationWarning.new(:results, competition.id,
                                               NO_ROUND_INFORMATION_WARNING,
                                               round_id: round_id)
            next
          end

          time_limit_for_round = round_info.time_limit

          if round_info.has_undef_tl?
            # This situation may happen with "old" competitions, where time limit
            # were possibly not enforced at the discretion of the WCA Delegate.
            # In which case we let the TL undefined, and no errors should be
            # generated.
            @warnings << ValidationWarning.new(:results, competition.id,
                                               UNDEF_TL_WARNING,
                                               round_id: round_id)
          end

          cutoff_for_round = round_info.cutoff

          results_for_round.each_with_index do |result, index|
            context = [competition.id, result, round_id, round_info]
            all_solve_times = result.solve_times

            # Check for possible similar results
            check_similar_results(context, index, results_for_round)

            # Check that the result's format matches the expected one
            check_format_matches(context)

            # Checks for cutoff
            check_results_for_cutoff(context, cutoff_for_round) if cutoff_for_round

            completed_solves = all_solve_times.select(&:complete?)

            # Below are checks for time limits, skip them if the time limit is undefined
            next if round_info.has_undef_tl?

            # Checks for time limits if it can be user-specified
            unless %w[333mbf 333fm].include?(result.eventId)
              cumulative_wcif_round_ids = time_limit_for_round.cumulative_round_ids

              check_result_after_dns(context, all_solve_times)

              case cumulative_wcif_round_ids.length
              when 0
                # easy case: each completed result (not DNS, DNF, or SKIPPED) must be below the time limit.
                results_over_time_limit = completed_solves.reject { |t| t.time_centiseconds < time_limit_for_round.centiseconds }
                if results_over_time_limit&.any?
                  @errors << ValidationError.new(:results, competition.id,
                                                 RESULT_OVER_TIME_LIMIT_ERROR,
                                                 round_id: round_id,
                                                 person_name: result.personName,
                                                 time_limit: time_limit_for_round.to_s(round_info))
                end
              else
                check_cumulative_across_rounds(context, rounds_info_by_round_id,
                                               results_by_round_id)
              end
            end

            check_multi_time_limit(context, competition.id, round_id, completed_solves) if result.eventId == "333mbf"
          end
        end
      end

      # Cleanup possible duplicate errors and warnings from cumulative time limits
      @errors.uniq!
      @warnings.uniq!
    end

    private

      def check_multi_time_limit(context, competition_id, round_id, completed_solves)
        _, result, = context
        completed_solves.each do |solve_time|
          time_limit_seconds = [3600, solve_time.attempted * 600].min
          if solve_time.time_seconds > time_limit_seconds
            @warnings << ValidationWarning.new(:results, competition_id,
                                               MBF_RESULT_OVER_TIME_LIMIT_WARNING,
                                               round_id: round_id,
                                               result: solve_time.clock_format,
                                               person_name: result.personName)
          end
        end
      end

      def check_similar_results(context, index, results_for_round)
        competition_id, result, round_id, = context
        similar = results_similar_to(result, index, results_for_round)
        similar.each do |r|
          @warnings << ValidationWarning.new(:results, competition_id,
                                             SIMILAR_RESULTS_WARNING,
                                             round_id: round_id,
                                             person_name: result.personName,
                                             similar_person_name: r.personName)
        end
      end

      def check_result_after_dns(context, all_solve_times)
        # Now let's try to find a DNS result followed by a non-DNS result
        first_index = all_solve_times.find_index(SolveTime::DNS)
        # Just use '5' here to get all of them
        if first_index && all_solve_times[first_index, 5].select(&:complete?).any?
          competition_id, result, round_id, = context
          @warnings << ValidationWarning.new(:results, competition_id,
                                             RESULT_AFTER_DNS_WARNING,
                                             round_id: round_id,
                                             person_name: result.personName)
        end
      end

      def check_format_matches(context)
        competition_id, result, round_id, round_info = context
        # FIXME: maybe that can be part of the separate
        # "check consistency of roundTypeIds and formatIds" across a given round
        # Check that the result's format matches the round format
        unless round_info.format.id == result.formatId
          @errors << ValidationError.new(:results, competition_id,
                                         MISMATCHED_RESULT_FORMAT_ERROR,
                                         round_id: round_id,
                                         person_name: result.personName,
                                         expected_format: round_info.format.name,
                                         format: Format.c_find(result.formatId).name)
        end
      end

      def check_results_for_cutoff(context, cutoff)
        competition_id, result, round_id, round = context
        number_of_attempts = cutoff.number_of_attempts
        cutoff_result = SolveTime.new(round.event.id, :single, cutoff.attempt_result)
        solve_times = result.solve_times
        # Compare through SolveTime so we don't need to care about DNF/DNS
        maybe_qualifying_results = solve_times[0, number_of_attempts]
        # Get the remaining attempt according to the expected solve count given the format
        other_results = solve_times[number_of_attempts, round.format.expected_solve_count - number_of_attempts]

        if maybe_qualifying_results.select(&:skipped?).any?
          # There are at least one skipped results among those in the first phase.
          @errors << ValidationError.new(:results, competition_id,
                                         WRONG_ATTEMPTS_FOR_CUTOFF_ERROR,
                                         round_id: round_id,
                                         person_name: result.personName)
        end

        qualifying_results = maybe_qualifying_results.select { |solve_time| solve_time < cutoff_result }
        skipped, unskipped = other_results.partition(&:skipped?)
        if qualifying_results.any?
          # Meets the cutoff, no result should be SKIPPED
          if skipped.any?
            @errors << ValidationError.new(:results, competition_id,
                                           MET_CUTOFF_MISSING_RESULTS_ERROR,
                                           round_id: round_id,
                                           person_name: result.personName,
                                           cutoff: cutoff.to_s(round))
          end
        else
          # Doesn't meet the cutoff, all results should be SKIPPED
          if unskipped.any?
            @errors << ValidationError.new(:results, competition_id,
                                           DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR,
                                           round_id: round_id,
                                           person_name: result.personName,
                                           cutoff: cutoff.to_s(round))
          end
        end
      end

      def check_cumulative_across_rounds(context, rounds_by_ids, results_by_round_id)
        competition_id, result, round_id, round_info = context
        time_limit_for_round = round_info.time_limit
        cumulative_wcif_round_ids = time_limit_for_round.cumulative_round_ids
        # Handle both cumulative for a single round or multiple round by doing the following:
        #  - gather all solve times for all the rounds (necessitate to map round's WCIF id to "our" round ids)
        #  - check the sum is below the limit
        #  - check for any suspicious DNF result

        # Match wcif round ids to "our" ids
        cumulative_round_ids = cumulative_wcif_round_ids.map do |wcif_id|
          parsed_wcif_id = Round.parse_wcif_id(wcif_id)
          # Get the actual round_id from our expected rounds by id

          actual_round_id = rounds_by_ids.find do |id, round|
            round.event.id == parsed_wcif_id[:event_id] && round.number == parsed_wcif_id[:round_number]
          end
          unless actual_round_id
            # FIXME: this needs to be removed when https://github.com/thewca/worldcubeassociation.org/issues/3254 is fixed.
            @errors << ValidationError.new(:results, competition_id,
                                           MISSING_CUMULATIVE_ROUND_ID_ERROR,
                                           wcif_id: wcif_id, original_round_id: round_id)
          end
          actual_round_id&.at(0)
        end.compact

        # Get all solve times for all cumulative rounds for the current person
        all_results_for_cumulative_rounds = cumulative_round_ids.map do |id|
          # NOTE: since we proceed with all checks even if some expected rounds
          # do not exist, we may have *expected* cumulative rounds that may
          # not exist in results.
          results_by_round_id[id]&.find { |r| r.personId == result.personId }
        end.compact.map(&:solve_times).flatten
        completed_solves_for_rounds = all_results_for_cumulative_rounds.select(&:complete?)
        number_of_dnf_solves = all_results_for_cumulative_rounds.select(&:dnf?).size
        sum_of_times_for_rounds = completed_solves_for_rounds.sum(&:time_centiseconds)

        # Check the sum is below the limit
        unless sum_of_times_for_rounds < time_limit_for_round.centiseconds
          @errors << ValidationError.new(:results, competition_id,
                                         RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR,
                                         round_ids: cumulative_round_ids.join(","),
                                         person_name: result.personName,
                                         time_limit: time_limit_for_round.to_s(round_info))
        end

        # Avoid any silly dividing by 0 on the next check.
        return if completed_solves_for_rounds.empty?

        # Check for any suspicious DNF
        # Compute avg time per solve for the competitor
        avg_per_solve = sum_of_times_for_rounds.to_f / completed_solves_for_rounds.size
        # We want to issue a warning if the estimated time for all solves + DNFs goes roughly over the cumulative time limit by at least 20% (estimation tolerance to reduce false positive).
        if (number_of_dnf_solves + completed_solves_for_rounds.size) * avg_per_solve >= 1.2 * time_limit_for_round.centiseconds
          @warnings << ValidationWarning.new(:results, competition_id,
                                             SUSPICIOUS_DNF_WARNING,
                                             round_ids: cumulative_round_ids.join(","),
                                             person_name: result.personName)
        end
      end

      def results_similar_to(reference, reference_index, results)
        # We do this programatically, but the original check_results.php used to do a big SQL query:
        # https://github.com/thewca/worldcubeassociation.org/blob/b1ee87b318ff6e4f8658a711c19fd23a3ae51b9c/webroot/results/admin/check_results.php#L321-L353

        similar_results = []
        # Note that we don't want to treat a particular result as looking
        # similar to itself, so we don't allow for results with matching ids.
        # Further more, if a result A is similar to a result B, we don't want to
        # return both (A, B) and (B, A) as matching pairs, it's sufficient to just
        # return (A, B), which is why we require A.id < B.id.
        results.each_with_index do |r, index|
          next if index >= reference_index
          # We attribute 1 point for each identical solve_time, we then just have to count the points.
          score = r.solve_times.zip(reference.solve_times).count do |solve_time, reference_solve_time|
            solve_time.complete? && solve_time == reference_solve_time
          end
          # We have at least 3 matching values, consider this similar
          if score > 2
            similar_results << r
          end
        end
        similar_results
      end
  end
end
