# frozen_string_literal: true

module CompetitionResultsValidator
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

  def self.validate(results, competition_id)
    all_errors = {
      competition: [],
      persons: [],
      events: [],
      rounds: [],
      results: [],
    }

    # Sanity check avoid much stuff
    if results["competitionId"] != competition_id
      all_errors[:competition] << "Results are for #{results["competitionId"]}, not #{competition_id}!"
      return [1, all_errors]
    end

    associations = {
      events: [],
      competition_events: {
        rounds: [:competition_event],
      }
    }
    competition = Competition.includes(associations).find(competition_id)
    expected_events = competition.events.map(&:id)
    expected_rounds_by_event_id = Hash[competition.competition_events.map { |ce| [ce.event.id, ce.rounds] }]
    expected_rounds_by_ids = Hash[competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.number}", r] }]
    expected_rounds_ids = expected_rounds_by_ids.keys


    # check persons
    # name, country are required; others can have 'empty' values (OK to fill in later)
    valid_persons_by_id = {}
    results["persons"]&.each do |p|
      blank_fields = ["id", "name", "countryId", "dob"].map { |f| p[f] }.select(&:blank?)
      if blank_fields.any?
        all_errors[:persons] << "Missing data for person '#{p["name"]}' with id #{p["id"]}"
        # skip
        next
      end
      if valid_persons_by_id[p["id"]]
        all_errors[:persons] << "Duplicate person with id #{p["id"]}"
      else
        valid_persons_by_id[p["id"]] = p
      end
    end

    # Assume nobody has results
    persons_without_results = valid_persons_by_id.keys


    detected_events = []
    detected_rounds_ids = []
    results["events"]&.each do |e|
      if detected_events.include?(e["eventId"])
        all_errors[:events] << "Duplicate results for #{e["eventId"]}"
        # Skip any other validation
        next
      end
      if !expected_events.include?(e["eventId"])
        all_errors[:events] << "Unexpected results for #{e["eventId"]}"
        # Skip any other validation
        next
      end
      detected_events << e["eventId"]
      rounds_for_event = expected_rounds_by_event_id[e["eventId"]]
      e["rounds"]&.each_with_index do |r, index|
        round_number = index + 1
        round_id = "#{e["eventId"]}-#{round_number}"
        if detected_rounds_ids.include?(round_id)
          all_errors[:rounds] << "Duplicate results for round #{round_id}"
          # Skip any other validation
          next
        end
        if !expected_rounds_ids.include?(round_id)
          all_errors[:rounds] << "Unexpected results for round #{round_id}"
          # Skip any other validation
          next
        end
        detected_rounds_ids << round_id
        # We are guaranted this round is at least expected
        # Now we check for cutoff change
        expected_round = rounds_for_event[index]
        if expected_round.roundTypeId != r["roundId"]
          if expected_round.cutoff
            all_errors[:rounds] << "#{e["eventId"]} round #{round_number} was expected to be combined but it is not the case in the results."
          else
            all_errors[:rounds] << "#{e["eventId"]} round #{round_number} is combined but was expected to not have a cutoff."
          end
          # Skip other validation
          next
        end
        if expected_round.format.id != r["formatId"]
          all_errors[:rounds] << "Wrong format for round #{round_id}: #{r["formatId"]} instead of #{expected_round.format.id}"
          next
        end
        time_limit_for_round = expected_round.time_limit
        cutoff_for_round = expected_round.cutoff
        format = expected_round.format
        unless r["results"]&.size > 0
          all_errors[:rounds] << "Round #{round_id} has no result!"
          next
        end
        # Validate results for the round
        r["results"].each do |result|
          person_id = result["personId"]
          unless valid_persons_by_id[person_id]
            all_errors[:results] << "[#{round_id}] Result is not linked to a valid person"
            next
          end
          person_name = valid_persons_by_id[person_id]["name"]
          if !["333mbf", "333fm"].include?(e["eventId"])
            results_over_time_limit = result["results"]&.select { |t| t > time_limit_for_round.centiseconds }
            if results_over_time_limit&.any?
              all_errors[:results] << "[#{round_id}] At least one result for #{person_name} is over the time limit."
            end
          end
          # TODO check cutoff
        end
      end
    end
    (expected_events - detected_events).each do |event_id|
      all_errors[:events] << "Missing results for #{event_id}"
    end
    (expected_rounds_ids - detected_rounds_ids).each do |round_id|
      all_errors[:rounds] << "Missing results for #{round_id}"
    end

    total_errors = all_errors.map(&:size).reduce(:+)
    [total_errors, all_errors]
  end
end
