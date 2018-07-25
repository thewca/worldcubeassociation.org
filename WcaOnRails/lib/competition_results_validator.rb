# frozen_string_literal: true

class CompetitionResultsValidator
  attr_reader :total_errors, :total_warnings, :errors, :warnings, :has_results, :inbox_persons, :inbox_results, :scrambles, :number_of_non_matching_rounds, :expected_rounds_by_ids

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
  DNS_AFTER_RESULT_WARNING = "[%{round_id}] %{person_name} has at least one DNS results followed by a valid result. Please make sure it is indeed a DNS and not a DNF."
  SAME_PERSON_NAME_WARNING = "Person '%{name}' exists with WCA ID %{wca_id} in the WCA database."\
    " A person in the uploaded results has the same name but has no WCA ID: please make sure they are different (and add a message about this to the WRT), or fix the results JSON."

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
    @number_of_non_matching_rounds = 0

    associations = {
      events: [],
      competition_events: {
        rounds: [:competition_event, :format],
      },
    }

    competition = Competition.includes(associations).find(competition_id)
    @inbox_results = InboxResult.sorted_for_competition(competition_id)
    @has_results = inbox_results.any?
    unless @has_results
      @total_errors = 1
      @errors[:results] << "The competition has no result."
      return
    end

    @inbox_persons = InboxPerson.where(competitionId: competition_id)
    @scrambles = Scramble.where(competitionId: competition_id)

    # check persons
    # basic checks on persons are done in the model, uniqueness for a given competition
    # is done in the SQL schema.

    # Map a personId to its corresponding object
    persons_by_id = Hash[inbox_persons.map { |person| [person.id, person] }]

    # Map a competition's (expected!) round id (eg: "444-f") to its corresponding object
    @expected_rounds_by_ids = Hash[competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.round_type_id}", r] }]

    # Group actual results by their round id
    results_by_round_id = @inbox_results.group_by { |r| "#{r.eventId}-#{r.roundTypeId}" }

    check_persons(persons_by_id)

    check_events_match(competition.events)

    @number_of_non_matching_rounds = check_rounds_match

    check_individual_results(results_by_round_id, persons_by_id)

    if @number_of_non_matching_rounds == 0
      # Only check the advancement conditions if all rounds match: this way we can rely
      # on the expected competition_events!
      check_avancement_conditions(results_by_round_id, competition.competition_events)
    end

    check_scrambles

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
      r.solve_times.each_with_index do |solve_time, solve_time_index|
        if solve_time.complete? && solve_time == reference_solve_times[solve_time_index]
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

  def check_events_match(competition_events)
    expected = competition_events.map(&:id)
    real = @inbox_results.map(&:eventId).uniq
    # Check for missing/unexpected events and rounds
    # It should handle cases where:
    #   - an event was added/deleted
    #   - a round changed format from what was planed (eg: Bo3 -> Bo1, no cutoff -> cutoff)
    # FIXME: maybe check for round_id (eg: "333-c") is enough
    (real - expected).each do |event_id|
      @errors[:events] << "Unexpected results for #{event_id}"
    end
    (expected - real).each do |event_id|
      @errors[:events] << "Missing results for #{event_id}"
    end
  end

  def check_rounds_match
    # Check that rounds match what was declared, and return the number of difference
    expected = @expected_rounds_by_ids.keys
    real = @inbox_results.map { |r| "#{r.eventId}-#{r.roundTypeId}" }.uniq
    unexpected = real - expected
    missing = expected - real
    unexpected.each do |round_id|
      @errors[:rounds] << "Unexpected results for round #{round_id}"
    end
    missing.each do |round_id|
      @errors[:rounds] << "Missing results for round #{round_id}"
    end
    unexpected.size + missing.size
  end

  def check_avancement_conditions(results_by_round_id, competition_events)
    competition_events.each do |ce|
      remaining_number_of_rounds = ce.rounds.size
      if remaining_number_of_rounds > 4
        # https://www.worldcubeassociation.org/regulations/#9m: Events must have at most four rounds.
        # Should not happen as we already have a validation to create rounds, but who knows...
        @errors[:rounds] << "Event #{ce.event_id} has more than four rounds, which must not happen per Regulation 9m."
      end
      ce.rounds.each do |r|
        remaining_number_of_rounds -= 1
        round_id = "#{ce.event_id}-#{r.round_type_id}"
        number_of_people_in_round = results_by_round_id[round_id].size
        if number_of_people_in_round <= 7 && remaining_number_of_rounds > 0
          # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
          @errors[:rounds] << "Round #{round_id} has 7 competitors or less but has at least one subsequent round, which must not happen per Regulation 9m3."
        end
        if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
          # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
          @errors[:rounds] << "Round #{round_id} has 15 competitors or less but has at least two subsequents rounds, which must not happen per Regulation 9m2."
        end
        if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
          # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most one subsequent round.
          @errors[:rounds] << "Round #{round_id} has 99 competitors or less but has at least three subsequents rounds, which must not happen per Regulation 9m1."
        end
      end
    end
  end

  def check_scrambles
    rounds_ids = @expected_rounds_by_ids.keys
    # Group scramble by round_id
    scrambles_by_round_id = @scrambles.group_by { |s| "#{s.eventId}-#{s.roundTypeId}" }
    detected_scrambles_rounds_ids = scrambles_by_round_id.keys
    (rounds_ids - detected_scrambles_rounds_ids).each do |round_id|
      @errors[:scrambles] << "[#{round_id}] Missing scrambles."
    end
    (detected_scrambles_rounds_ids - rounds_ids).each do |round_id|
      @errors[:scrambles] << "[#{round_id}] Unexpected scrambles."
    end

    # For existing rounds and scrambles, check that the number of scrambles match at least
    # the number of expected scrambles.
    (detected_scrambles_rounds_ids & rounds_ids).each do |round_id|
      format = @expected_rounds_by_ids[round_id].format
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
  end

  def check_persons(persons_by_id)
    detected_person_ids = persons_by_id.keys
    persons_with_results = @inbox_results.map(&:personId)
    (detected_person_ids - persons_with_results).each do |person_id|
      @errors[:persons] << "Person with id #{person_id} (#{persons_by_id[person_id].name}) has no result"
    end
    (persons_with_results - detected_person_ids).each do |person_id|
      @errors[:persons] << "Results for unknown person with id #{person_id}"
    end

    without_wca_id, with_wca_id = persons_by_id.map { |_, p| p }.partition { |p| p.wcaId.empty? }
    if without_wca_id.any?
      existing_person_in_db = Person.where(name: without_wca_id.map(&:name))
      existing_person_in_db.each do |p|
        @warnings[:persons] << format(SAME_PERSON_NAME_WARNING, name: p.name, wca_id: p.wca_id)
      end
    end
    without_wca_id.each do |p|
      if p.dob.month == 1 && p.dob.day == 1
        @warnings[:persons] << "The date of birth of #{p.name} is on January 1st, please make sure it's correct."
      end
      # Competitor less than 3 years old are extremely rare, so we'd better check these birthdate are correct
      if p.dob.year >= Time.now.year - 3
        @warnings[:persons] << "#{p.name} seems to be less than 3 years old, please make sure it's correct."
      end
      # Look for double whitespaces or leading/trailing whitespaces
      unless p.name.squeeze(" ").strip == p.name
        @errors[:persons] << "Person '#{p.name}' has leading/trailing whitespaces or double whitespaces."
      end
    end
    existing_person_by_wca_id = Hash[Person.where(wca_id: with_wca_id.map(&:wcaId)).map { |p| [p.wca_id, p] }]
    with_wca_id.each do |p|
      existing_person = existing_person_by_wca_id[p.wcaId]
      if existing_person
        # FIXME: check with WRT we do want to show errors here, or just warnings, or nothing!
        # (If I get this right, we do not actually update existing persons from InboxPerson)
        unless p.dob == existing_person.dob
          @errors[:persons] << "Wrong birthdate for #{p.name} (#{p.wcaId})."
        end
        # FIXME: Not using this checks for now, until I get feedback from WRT
        # unless p.countryId == existing_person.country_iso2
        # @errors[:persons] << "Wrong country for #{p.name} (#{p.wcaId})."
        # end
        # unless p.gender == existing_person.gender
        # @errors[:persons] << "Wrong gender for #{p.name} (#{p.wcaId})."
        # end
      else
        @errors[:persons] << "Person #{p.name} has a WCA ID which does not exist: #{p.wcaId}."
      end
    end
  end

  def check_results_for_cutoff(cutoff, result, round_id, round, persons_by_id)
    number_of_attempts = cutoff.number_of_attempts
    cutoff_result = SolveTime.new(round.event.id, :single, cutoff.attempt_result)
    solve_times = result.solve_times
    # Compare through SolveTime so we don't need to care about DNF/DNS
    maybe_qualifying_results = solve_times[0, number_of_attempts]
    # Get the remaining attempt according to the expected solve count given the format
    other_results = solve_times[number_of_attempts, round.format.expected_solve_count - number_of_attempts]
    qualifying_results = maybe_qualifying_results.select { |solve_time| solve_time < cutoff_result }
    skipped, unskipped = other_results.partition(&:skipped?)
    person = persons_by_id[result.personId]
    if qualifying_results.any?
      # Meets the cutoff, no result should be SKIPPED
      if skipped.any?
        @errors[:results] << "[#{round_id}] #{person.name} has met the cutoff but is missing results for the second phase. Cutoff is #{cutoff.to_s(round)}."
      end
    else
      # Doesn't meet the cutoff, all results should be SKIPPED
      if unskipped.any?
        @errors[:results] << "[#{round_id}] #{person.name} has at least one result for the second phase but didn't meet the cutoff. Cutoff is #{cutoff.to_s(round)}."
      end
    end
  end

  def check_individual_results(results_by_round_id, persons_by_id)
    # For results
    #   - average/best check is done in validation
    #   - "correct" number of attempts is done in validation (but NOT cutoff times)
    #   - check time limit
    #   - check cutoff
    #   - check position
    #   - warn for suspiscious DOB (January 1st)
    #   - warn for existing name in the db but no ID (can happen, but the Delegate should add a note)

    results_by_round_id.each do |round_id, results_for_round|
      # get cutoff and timelimit
      round_info = @expected_rounds_by_ids[round_id]
      unless round_info
        # These results are for an undeclared round, skip them as an error has
        # already been registered
        next
      end

      time_limit_for_round = round_info.time_limit
      cutoff_for_round = round_info.cutoff

      expected_pos = 0
      last_result = nil
      # Number of tied competitors, *without* counting the first one
      number_of_tied = 0
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
        if last_result && result.average == last_result.average && result.best == last_result.best
          number_of_tied += 1
        else
          expected_pos += 1
          expected_pos += number_of_tied
          number_of_tied = 0
        end
        last_result = result

        if expected_pos != result.pos
          @errors[:results] << "[#{round_id}] Result for #{person_info.name} has a wrong position: expected #{expected_pos} and got #{result.pos}."
        end

        # Checks for cutoff
        check_results_for_cutoff(cutoff_for_round, result, round_id, round_info, persons_by_id) if cutoff_for_round

        # Checks for time limits if it can be user-specified
        if !["333mbf", "333fm"].include?(result.eventId)
          cumulative_round_ids = time_limit_for_round.cumulative_round_ids
          completed_solves = all_solve_times.select(&:complete?)
          # Now let's try to find a DNF/DNS result followed by a non-DNF/DNS result
          # Do the same for DNS.
          has_result_after = { SolveTime::DNF => false, SolveTime::DNS => false }
          has_result_after.keys.each do |not_complete|
            first_index = all_solve_times.find_index(not_complete)
            if first_index
              # Just use '5' here to get all of them
              solves_after = all_solve_times[first_index, 5]
              has_result_after[not_complete] = solves_after.select(&:complete?).any?
            end
          end

          # Always output the warning about DNS followed by result
          if has_result_after[SolveTime::DNS]
            @warnings[:results] << format(DNS_AFTER_RESULT_WARNING, round_id: round_id, person_name: person_info.name)
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
            if has_result_after[SolveTime::DNF]
              @warnings[:results] << format(DNF_AFTER_RESULT_WARNING, round_id: round_id, person_name: person_info.name)
            end
          else
            # cross-rounds time limit, the sum of all the results for all the rounds must be below the cumulative time limit.
            # if there is any DNF -> warn the Delegate and ask him to double check the time for them.
            # TODO
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
  end
end
