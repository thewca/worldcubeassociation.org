# frozen_string_literal: true

class CompetitionResultsValidator
  attr_reader :total_errors, :total_warnings, :errors, :warnings, :has_results

  INDIVIDUAL_RESULT_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "personId" => { "type" => "number" },
      "position" => { "type" => "number" },
      "results" => {
        "type" => "array",
        "items" => { "type" => "number" },
      },
      "best" => { "type" => "number" },
      "average" => { "type" => "number" },
    },
    "required" => ["personId", "position", "results", "best", "average"],
  }.freeze

  GROUP_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "group" => { "type" => "string" },
      "scrambles" => {
        "type" => "array",
        "items" => { "type" => "string" },
      },
      "extraScrambles" => {
        "type" => "array",
        "items" => { "type" => "string" },
      },
    },
    "required" => ["group", "scrambles", "extraScrambles"],
  }.freeze

  ROUND_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "roundId" => { "type" => "string" },
      "formatId" => { "type" => "string" },
      "results" => {
        "type" => "array",
        "items" => INDIVIDUAL_RESULT_JSON_SCHEMA,
      },
      "groups" => {
        "type" => "array",
        "items" => GROUP_JSON_SCHEMA,
      },
    },
    "required" => ["roundId", "formatId", "results", "groups"],
  }.freeze

  PERSON_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "id" => { "type" => "number" },
      "name" => { "type" => "string" },
      # May be empty
      "wcaId" => { "type" => "string" },
      "countryId" => { "type" => "string" },
      # May be empty
      "gender" => { "type" => "string" },
      "dob" => { "type" => "string" },
    },
    "required" => ["id", "name", "wcaId", "countryId", "gender", "dob"],
  }.freeze

  EVENT_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "eventId" => { "type" => "string" },
      "rounds" => {
        "type" => "array",
        "items" => ROUND_JSON_SCHEMA,
      },
    },
    "required" => ["eventId", "rounds"],
  }.freeze

  RESULT_JSON_SCHEMA = {
    "type" => "object",
    "properties" => {
      "formatVersion" => { "type" => "string" },
      "competitionId" => { "type" => "string" },
      "persons" => {
        "type" => "array",
        "items" => PERSON_JSON_SCHEMA,
      },
      "events" => {
        "type" => "array",
        "items" => EVENT_JSON_SCHEMA,
      },
    },
    "required" => ["formatVersion", "competitionId", "persons", "events"],
  }.freeze

  DNF_AFTER_RESULT_WARNING = "[%{round_id}] The round has a cumulative time limit and %{person_name} has at least one DNF results followed by a valid result."\
    " Please make sure the time elapsed for the DNF was short enough to allow for the other subsequent valid results to count."

  def initialize(competition_id)
    @errors = {
      persons: [],
      events: [],
      rounds: [],
      results: [],
      scrambles: [],
    }
    @warnings = {
      persons: [],
      results: [],
    }
    @total_errors = 0
    @total_warnings = 0

    associations = {
      events: [],
      competition_events: {
        rounds: [:competition_event, :format],
      },
    }

    competition = Competition.includes(associations).find(competition_id)
    inbox_results = InboxResult.sorted_for_competition(competition_id)
    @has_results = inbox_results.any?
    unless @has_results
      return
    end

    inbox_persons = InboxPerson.where(competitionId: competition_id)
    scrambles = Scramble.where(competitionId: competition_id)

    # check persons
    # basic checks on persons are done in the model, uniqueness for a given competition
    # is done in the SQL schema.

    # Check that the persons who have results matches exactly the persons in InboxPerson
    persons_by_id = Hash[inbox_persons.map { |person| [person.id, person] }]
    detected_person_ids = persons_by_id.keys
    persons_with_results = inbox_results.map(&:personId)
    (detected_person_ids - persons_with_results).each do |person_id|
      @errors[:events] << "Person with id #{person_id} (#{persons_by_id[person_id]}) has no result"
    end
    (persons_with_results - detected_person_ids).each do |person_id|
      @errors[:events] << "Results for unknown person with id #{person_id}"
    end

    expected_events = competition.events.map(&:id)
    expected_rounds_by_ids = Hash[competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.round_type_id}", r] }]
    expected_rounds_ids = expected_rounds_by_ids.keys

    detected_events = inbox_results.map(&:eventId).uniq
    detected_rounds_ids = inbox_results.map { |r| "#{r.eventId}-#{r.roundTypeId}" }.uniq

    # Check for missing/unexpected events and rounds
    # It should handle cases where:
    #   - an event was added/deleted
    #   - a round changed format from what was planed (eg: Bo3 -> Bo1, no cutoff -> cutoff)
    # FIXME: maybe check for round_id (eg: "333-c") is enough
    (detected_events - expected_events).each do |event_id|
      @errors[:events] << "Unexpected results for #{event_id}"
    end
    (expected_events - detected_events).each do |event_id|
      @errors[:events] << "Missing results for #{event_id}"
    end
    (detected_rounds_ids - expected_rounds_ids).each do |round_id|
      @errors[:rounds] << "Unexpected results for round #{round_id}"
    end
    (expected_rounds_ids - detected_rounds_ids).each do |round_id|
      @errors[:rounds] << "Missing results for round #{round_id}"
    end

    # For results
    #   - average/best check is done in validation
    #   - "correct" number of attempts is done in validation (but NOT cutoff times)
    #   - check time limit
    #   - check cutoff
    #   - check position
    #   - warn for suspiscious DOB (January 1st)
    #   - warn for existing name in the db but no ID (can happen, but the Delegate should add a note)

    # Group result by round_id
    results_by_round_id = inbox_results.group_by { |r| "#{r.eventId}-#{r.roundTypeId}" }

    results_by_round_id.each do |round_id, results_for_round|
      # get cutoff and timelimit
      round_info = expected_rounds_by_ids[round_id]
      unless round_info
        # These results are for an undeclared round, skip them as an error has
        # already been registered
        next
      end

      time_limit_for_round = round_info.time_limit
      cutoff_for_round = round_info.cutoff

      expected_pos = 1
      last_result = results_for_round.first
      results_for_round.each_with_index do |result, index|
        person_info = persons_by_id[result.personId]
        unless person_info
          # These results are for an undeclared person, skip them as an error has
          # already been registered
          next
        end
        all_solve_times = result.solve_times

        # Check for position in round
        # The scope "InboxResult.sorted_for_competition" already sorts by average then best,
        # so we simply need to check that the position stored matched the expected one

        # Unless we find two exact same results, we increase the expected position
        unless result.average == last_result.average and result.best == last_result.best
          expected_pos += 1
        end
        last_result = result

        if expected_pos != result.pos
          @errors[:results] << "[#{round_id}] Result for #{person_info.name} has a wrong position: expected #{expected_pos} and got #{result.pos}."
        end

        # Checks for cutoff
        if cutoff_for_round
          number_of_attempts = cutoff_for_round.number_of_attempts
          cutoff_result = SolveTime.new(result.eventId, :single, cutoff_for_round.attempt_result)
          # Compare through SolveTime so we don't need to care about DNF/DNS
          maybe_qualifying_results = all_solve_times[0, number_of_attempts]
          # Just use '5' here to get all the remaining solve_times
          other_results = all_solve_times[number_of_attempts, 5]
          qualifying_results = maybe_qualifying_results.select { |solve_time| solve_time < cutoff_result }
          skipped, unskipped = other_results.partition(&:skipped?)
          if qualifying_results.any?
            # Meets the cutoff, no result should be SKIPPED
            if skipped.any?
              @errors[:results] << "[#{round_id}] #{person_info.name} has met the cutoff but is missing results for the second phase. Cutoff is #{cutoff_for_round.to_s(round_info)}."
            end
          else
            # Doesn't meet the cutoff, all results should be SKIPPED
            if unskipped.any?
              @errors[:results] << "[#{round_id}] #{person_info.name} has at least one result for the second phase but didn't meet the cutoff. Cutoff is #{cutoff_for_round.to_s(round_info)}."
            end
          end
        end

        # Checks for time limits if it can be user-specified
        if !["333mbf", "333fm"].include?(result.eventId)
          cumulative_round_ids = time_limit_for_round.cumulative_round_ids
          completed_solves = all_solve_times.select(&:complete?)
          # Now let's try to find a DNF result followed by a non-DNF result
          has_result_after_dnf = false
          first_dnf_index = all_solve_times.find_index(SolveTime::DNF)
          if first_dnf_index
            # Again using 5 just to get all
            solves_after = all_solve_times[first_dnf_index, 5]
            has_result_after_dnf = solves_after.select(&:complete?).any?
          end

          case cumulative_round_ids.length
          when 0
            # easy case: each completed result (not DNS, DNF, or SKIPPED) must be below the time limit.
            results_over_time_limit = completed_solves.select { |t| t.time_centiseconds > time_limit_for_round.centiseconds }
            if results_over_time_limit&.any?
              @errors[:results] << "[#{round_id}] At least one result for #{person_info.name} is over the time limit which is #{time_limit_for_round.to_s(round_info)} for one solve."
            end
          when 1
            # cumulative for the round: the sum of each time must be below the cumulative time limit.
            # if there is any DNF -> warn the Delegate and ask him to double check the time for them.
            sum_of_times = completed_solves.map(&:time_centiseconds).reduce(&:+) || 0
            if sum_of_times > time_limit_for_round.centiseconds
              @errors[:results] << "[#{round_id}] The sum of results for #{person_info.name} is over the time limit which is #{time_limit_for_round.to_s(round_info)}."
            end
            if has_result_after_dnf
              @warnings[:results] << format(DNF_AFTER_RESULT_WARNING, round_id: round_id, person_name: person_info.name)
            end
          else
            # cross-rounds time limit, the sum of all the results for all the rounds must be below the cumulative time limit.
            # if there is any DNF -> warn the Delegate and ask him to double check the time for them.
            @errors[:results] << "Cumul across rounds not implemented"
          end
        end

        # Check for possible similar results
        similar = results_similar_to(result, index, results_for_round)
        similar.each do |r|
          similar_person_name = persons_by_id[r.personId]&.name || "UnknownPerson"
          @warnings[:results] << "[#{round_id}] Result of #{person_info.name} is similar to the results of #{similar_person_name}."
        end

      end
    end

    # Group scramble by round_id
    scrambles_by_round_id = scrambles.group_by { |s| "#{s.eventId}-#{s.roundTypeId}" }
    detected_scrambles_rounds_ids = scrambles_by_round_id.keys
    (detected_rounds_ids - detected_scrambles_rounds_ids).each do |round_id|
      @errors[:scrambles] << "[#{round_id}] Missing scrambles."
    end
    (detected_scrambles_rounds_ids - detected_rounds_ids).each do |round_id|
      @errors[:scrambles] << "[#{round_id}] Unexpected scrambles."
    end

    # For existing rounds and scrambles, check that the number of scrambles match at least
    # the number of expected scrambles.
    (detected_scrambles_rounds_ids & expected_rounds_ids).each do |round_id|
      format = expected_rounds_by_ids[round_id].format
      expected_number_of_scrambles = format.expected_solve_count
      scrambles_by_group_id = scrambles_by_round_id[round_id].group_by(&:groupId)
      scrambles_by_group_id.each do |group_id, scrambles_for_group|
        # filter out extra scrambles
        actual_number_of_scrambles = scrambles_for_group.reject(&:isExtra).size
        if actual_number_of_scrambles < expected_number_of_scrambles
          @errors[:scrambles] << "[#{round_id}] Group #{group_id}: missing scrambles, detected only #{actual_number_of_scrambles} instead of #{expected_number_of_scrambles}"
        end
      end
    end

    @total_errors = @errors.map { |key, value| value }.map(&:size).reduce(:+)
    @total_warnings = @warnings.map { |key, value| value }.map(&:size).reduce(:+)
  end

  private
  def results_similar_to(reference, reference_index, results)
    # We do this programatically, but the original check_results.php used to do a big SQL query:
    # https://github.com/thewca/worldcubeassociation.org/blob/b1ee87b318ff6e4f8658a711c19fd23a3ae51b9c/webroot/results/admin/check_results.php#L321-L353

    similar_results = []
    # Note that we don't want to treat a particular result as looking
    # similar to itself, so we don't allow for results with matching ids.
    # Further more, if a result A is similar to a result B, we don't want to
    # return both (A, B) and (B, A) as matching pairs, it's sufficient to just
    # return (A, B), which is why we require Result.id < h.resultId.
    results.each_with_index do |r, index|
      next if index >= reference_index
      score = 0
      reference_solve_times = reference.solve_times
      r.solve_times.each_with_index do |solve_time, index|
        if solve_time.complete? && solve_time == reference_solve_times[index]
          score += 1
        end
      end
      # We have at least 3 matching values, consider this similar
      if score > 2
        similar_results << r
      end
    end
    similar_results
  end
end
