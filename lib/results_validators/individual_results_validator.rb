# frozen_string_literal: true

module ResultsValidators
  class IndividualResultsValidator < GenericValidator
    MBF_RESULT_OVER_TIME_LIMIT_WARNING = :mbf_result_over_time_limit_warning

    RESULT_AFTER_DNS_WARNING = :result_after_dns_warning
    SIMILAR_RESULTS_WARNING = :similar_results_warning

    MET_CUTOFF_MISSING_RESULTS_ERROR = :met_cutoff_but_missing_results_error
    DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR = :didnt_meet_cutoff_but_has_results_error
    WRONG_ATTEMPTS_FOR_CUTOFF_ERROR = :wrong_attempts_for_cutoff_error
    RESULT_OVER_TIME_LIMIT_ERROR = :result_over_time_limit_error
    RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR = :results_over_cumulative_time_limit_error
    UNDEF_TL_WARNING = :undefined_time_limit_warning
    SUSPICIOUS_DNF_WARNING = :suspicious_dnf_warning

    # Miscellaneous errors
    MISSING_CUMULATIVE_ROUND_ID_ERROR = :missing_cumulative_round_id_error

    def self.description
      "This validator checks that all results respect the format, time limit, and cutoff information if available. It also looks for similar results within the round."
    end

    def self.automatically_fixable?
      false
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition

        results_for_comp = competition_data.results
        results_by_round = results_for_comp.group_by(&:round)

        results_by_round.each do |round, results_for_round|
          # get cutoff and time limit
          time_limit_for_round = round.time_limit

          if round.time_limit_undefined?
            # This situation may happen with "old" competitions, where time limit
            # were possibly not enforced at the discretion of the WCA Delegate.
            # In which case we let the TL undefined, and no errors should be
            # generated.
            @warnings << ValidationWarning.new(UNDEF_TL_WARNING,
                                               :results, competition.id,
                                               round_id: round.human_id)
          end

          cutoff_for_round = round.cutoff

          results_for_round.each_with_index do |result, index|
            context = [competition, result, round]
            all_solve_times = result.solve_times

            # Check for possible similar results
            check_similar_results(context, index, results_for_round)

            # Checks for cutoff
            check_results_for_cutoff(context, cutoff_for_round) if cutoff_for_round

            completed_solves = all_solve_times.select(&:complete?)

            # Below are checks for time limits, skip them if the time limit is undefined
            next if round.time_limit_undefined?

            # Checks for time limits if it can be user-specified
            unless %w[333mbf 333fm].include?(result.event_id)
              cumulative_wcif_round_ids = time_limit_for_round.cumulative_round_ids

              check_result_after_dns(context, all_solve_times)

              case cumulative_wcif_round_ids.length
              when 0
                # easy case: each completed result (not DNS, DNF, or SKIPPED) must be below the time limit.
                results_over_time_limit = completed_solves.reject { |t| t.time_centiseconds < time_limit_for_round.centiseconds }
                if results_over_time_limit&.any?
                  @errors << ValidationError.new(RESULT_OVER_TIME_LIMIT_ERROR,
                                                 :results, competition.id,
                                                 round_id: round.human_id,
                                                 person_name: result.person_name,
                                                 time_limit: time_limit_for_round.to_s(round))
                end
              else
                check_cumulative_across_rounds(context, results_by_round)
              end
            end

            check_multi_time_limit(context, completed_solves) if result.event_id == "333mbf"
          end
        end
      end

      # Cleanup possible duplicate errors and warnings from cumulative time limits
      @errors.uniq!
      @warnings.uniq!
    end

    private

      def check_multi_time_limit(context, completed_solves)
        competition, result, round = context
        completed_solves.each do |solve_time|
          time_limit_seconds = [3600, solve_time.attempted * 600].min
          next unless solve_time.time_seconds > time_limit_seconds

          @warnings << ValidationWarning.new(MBF_RESULT_OVER_TIME_LIMIT_WARNING,
                                             :results, competition.id,
                                             round_id: round.human_id,
                                             result: solve_time.clock_format,
                                             person_name: result.person_name)
        end
      end

      def check_similar_results(context, index, results_for_round)
        competition, result, round = context
        similar = results_similar_to(result, index, results_for_round)
        similar.each do |r|
          @warnings << ValidationWarning.new(SIMILAR_RESULTS_WARNING,
                                             :results, competition.id,
                                             round_id: round.human_id,
                                             person_name: result.person_name,
                                             similar_person_name: r.person_name)
        end
      end

      def check_result_after_dns(context, all_solve_times)
        # Now let's try to find a DNS result followed by a non-DNS result
        first_index = all_solve_times.find_index(&:dns?)
        # Just use '5' here to get all of them
        return unless first_index && all_solve_times[first_index, 5].any?(&:complete?)

        competition, result, round = context
        @warnings << ValidationWarning.new(RESULT_AFTER_DNS_WARNING,
                                           :results, competition.id,
                                           round_id: round.human_id,
                                           person_name: result.person_name)
      end

      def check_results_for_cutoff(context, cutoff)
        competition, result, round = context
        number_of_attempts_for_cutoff = cutoff.number_of_attempts
        total_number_of_attempts = round.format.expected_solve_count
        cutoff_result = SolveTime.new(round.event.id, :single, cutoff.attempt_result)
        solve_times = result.solve_times
        # Compare through SolveTime so we don't need to care about DNF/DNS
        maybe_qualifying_results = solve_times[0, number_of_attempts_for_cutoff]
        # Get the remaining attempt according to the expected solve count given the format
        other_results = solve_times[number_of_attempts_for_cutoff, total_number_of_attempts - number_of_attempts_for_cutoff]
        if maybe_qualifying_results.length < number_of_attempts_for_cutoff
          # There are not enough results for cutoff
          @errors << ValidationError.new(WRONG_ATTEMPTS_FOR_CUTOFF_ERROR,
                                         :results, competition.id,
                                         round_id: round.human_id,
                                         person_name: result.person_name)
        end

        qualifying_results = maybe_qualifying_results.select { |solve_time| solve_time < cutoff_result }
        total_solves = solve_times.length
        if qualifying_results.any?
          # Meets the cutoff, should have all attempts
          if total_solves != total_number_of_attempts
            @errors << ValidationError.new(MET_CUTOFF_MISSING_RESULTS_ERROR,
                                           :results, competition.id,
                                           round_id: round.human_id,
                                           person_name: result.person_name,
                                           cutoff: cutoff.to_s(round))
          end
        elsif other_results.present?
          # Doesn't meet the cutoff, shouldn't have anymore attempts
          @errors << ValidationError.new(DIDNT_MEET_CUTOFF_HAS_RESULTS_ERROR,
                                         :results, competition.id,
                                         round_id: round.human_id,
                                         person_name: result.person_name,
                                         cutoff: cutoff.to_s(round))
        end
      end

      def check_cumulative_across_rounds(context, results_by_round)
        competition, result, round = context
        time_limit_for_round = round.time_limit
        cumulative_wcif_round_ids = time_limit_for_round.cumulative_round_ids
        # Handle both cumulative for a single round or multiple round by doing the following:
        #  - gather all solve times for all the rounds (necessitate to map round's WCIF id to "our" round ids)
        #  - check the sum is below the limit
        #  - check for any suspicious DNF result

        # Match wcif round ids to "our" ids
        cumulative_rounds = cumulative_wcif_round_ids.filter_map do |wcif_id|
          parsed_wcif_id = Round.parse_wcif_id(wcif_id)
          # Get the actual round_id from our expected rounds by id

          actual_round = results_by_round.keys.find do |rd|
            rd.event_id == parsed_wcif_id[:event_id] && rd.number == parsed_wcif_id[:round_number]
          end
          unless actual_round
            # FIXME: this may need to be removed per https://github.com/thewca/worldcubeassociation.org/issues/8656.
            @errors << ValidationError.new(MISSING_CUMULATIVE_ROUND_ID_ERROR,
                                           :results, competition.id,
                                           wcif_id: wcif_id, original_round_id: round.human_id)
          end
          actual_round
        end

        # Get all solve times for all cumulative rounds for the current person
        all_results_for_cumulative_rounds = cumulative_rounds.filter_map do |rd|
          # NOTE: since we proceed with all checks even if some expected rounds
          # do not exist, we may have *expected* cumulative rounds that may
          # not exist in results.
          results_by_round[rd]&.find { |r| r.person_id == result.person_id }
        end.flat_map(&:solve_times)
        completed_solves_for_rounds = all_results_for_cumulative_rounds.select(&:complete?)
        number_of_dnf_solves = all_results_for_cumulative_rounds.count(&:dnf?)
        sum_of_times_for_rounds = completed_solves_for_rounds.sum(&:time_centiseconds)

        # Check the sum is below the limit
        unless sum_of_times_for_rounds < time_limit_for_round.centiseconds
          @errors << ValidationError.new(RESULTS_OVER_CUMULATIVE_TIME_LIMIT_ERROR,
                                         :results, competition.id,
                                         round_ids: cumulative_rounds.map(&:human_id).join(","),
                                         person_name: result.person_name,
                                         time_limit: time_limit_for_round.to_s(round))
        end

        # Avoid any silly dividing by 0 on the next check.
        return if completed_solves_for_rounds.empty?

        # Check for any suspicious DNF
        # Compute avg time per solve for the competitor
        avg_per_solve = sum_of_times_for_rounds.to_f / completed_solves_for_rounds.size
        # We want to issue a warning if the estimated time for all solves + DNFs goes roughly over the cumulative time limit by at least 20% (estimation tolerance to reduce false positive).
        return unless (number_of_dnf_solves + completed_solves_for_rounds.size) * avg_per_solve >= 1.2 * time_limit_for_round.centiseconds

        @warnings << ValidationWarning.new(SUSPICIOUS_DNF_WARNING,
                                           :results, competition.id,
                                           round_ids: cumulative_rounds.map(&:human_id).join(","),
                                           person_name: result.person_name)
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
          similar_results << r if score > 2
        end
        similar_results
      end
  end
end
