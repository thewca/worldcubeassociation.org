# frozen_string_literal: true

class CompetitionResultsValidator
  attr_reader :total_errors, :total_warnings, :errors, :warnings, :has_results, :persons, :persons_by_id, :results, :scrambles, :number_of_non_matching_rounds, :expected_rounds_by_ids, :check_real_results

  # List of all possible errors and warnings for the results

  # General errors and warnings
  UNEXPECTED_RESULTS_ERROR = "Unexpected results for %{event_id}. The event is present in the results but not listed as an official event."\
    " Remove the event from the results or contact the WCAT to request the event to be added to the WCA website."
  MISSING_RESULTS_WARNING = "Missing results for %{event_id}. The event is not present in the results but listed as an official event."\
    " If the event was held, correct the results. If the event was not held, leave a comment about that to the WRT."
  UNEXPECTED_ROUND_RESULTS_ERROR = "Unexpected results for round %{round_id}. The round is present in the results but not created on the events tab. Edit the events tab to include the round."
  MISSING_ROUND_RESULTS_ERROR = "Missing results for round %{round_id}. There is an additional round in the events tab that is not present in the results. Edit the events tab to remove the round."
  UNEXPECTED_COMBINED_ROUND_ERROR = "No cutoff was announced for '%{round_name}', but it has been detected as a combined round in the results. Please update the round's information in the competition's manage events page."
  MISSING_SCRAMBLES_FOR_ROUND_ERROR = "[%{round_id}] Missing scrambles. Use the workbook assistant to add the correct scrambles to the round."
  UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR = "[%{round_id}] Too many scrambles. Use the workbook assistant to uncheck the unused scrambles."
  MISSING_SCRAMBLES_FOR_GROUP_ERROR = "[%{round_id}] Group %{group_id}: missing scrambles, detected only %{actual} instead of %{expected}."
  CHOOSE_MAIN_EVENT_WARNING = "Your results do not contain results for 3x3x3 Cube. Please tell WRT in the comments that there was 'no main event' if no event was treated as the main event at the competition."\
  " Otherwise, if an event other than 3x3x3 Cube was treated as the main event, please name the main event in your comments to WRT and explain how that event was treated as the main event of the competition."

  # Regulations-specific errors and warnings
  COMPETITOR_LIMIT_WARNING = "The number of persons in the competition (%{n_competitors}) is above the competitor limit (%{competitor_limit})."\
    " Unless a specific agreement was made when announcing the competition (such as a per-day competitor limit), the results of the competitors registered after the competitor limit was reached must be removed."
  REGULATION_9M_ERROR = "Event %{event_id} has more than four rounds, which must not happen per Regulation 9m."
  REGULATION_9M1_ERROR = "Round %{round_id} has 99 competitors or less but has at least three subsequents rounds, which must not happen per Regulation 9m1."
  REGULATION_9M2_ERROR = "Round %{round_id} has 15 competitors or less but has at least two subsequents rounds, which must not happen per Regulation 9m2."
  REGULATION_9M3_ERROR = "Round %{round_id} has 7 competitors or less but has at least one subsequent round, which must not happen per Regulation 9m3."
  REGULATION_9P1_ERROR = "Round %{round_id}: there was not 25%% of competitors eliminated, which is needed per Regulation 9p1."
  OLD_REGULATION_9P_ERROR = "Round %{round_id}: there must be at least one competitor eliminated, which is required per Regulation 9p (competitions before April 2010)."

  # Person-related errors and warnings
  PERSON_WITHOUT_RESULTS_ERROR = "Person with id %{person_id} (%{person_name}) has no result"
  RESULTS_WITHOUT_PERSON_ERROR = "Results for unknown person with id %{person_id}"
  WHITESPACE_IN_NAME_ERROR = "Person '%{name}' has leading/trailing whitespaces or double whitespaces."
  WRONG_WCA_ID_ERROR = "Person %{name} has a WCA ID which does not exist: %{wca_id}."
  WRONG_PARENTHESIS_FORMAT_ERROR = "Opening parenthesis in '%{name}' must be preceeded by a space."
  DOB_0101_WARNING = "The date of birth of %{name} is on January 1st, please make sure it's correct."
  VERY_YOUNG_PERSON_WARNING = "%{name} seems to be less than 3 years old, please make sure it's correct."
  SAME_PERSON_NAME_WARNING = "Person '%{name}' exists with one or multiple WCA IDs (%{wca_ids}) in the WCA database."\
    " A person in the uploaded results has the same name but has no WCA ID: please make sure they are different (and add a message about this to the WRT), or fix the results JSON."
  NON_MATCHING_DOB_WARNING = "Wrong birthdate for %{name} (%{wca_id}), expected '%{expected_dob}' got '%{dob}'."
  NON_MATCHING_GENDER_WARNING = "Wrong gender for %{name} (%{wca_id}), expected '%{expected_gender}' got '%{gender}'."
  NON_MATCHING_NAME_WARNING = "Wrong name for %{wca_id}, expected '%{expected_name}' got '%{name}'. If the competitor did not change their name then fix the name to the expected name."
  NON_MATCHING_COUNTRY_WARNING = "Wrong country for %{name} (%{wca_id}), expected '%{expected_country}' got '%{country}'. If this is an error, fix it. Otherwise, do leave a comment to the WRT about it."

  # Miscelaneous errors
  MISSING_CUMULATIVE_ROUND_ID_ERROR = "[%{original_round_id}] Unable to find the round \"%{wcif_id}\" for the cumulative time limit specified in the WCIF."\
  " Please go to the manage events page and remove %{wcif_id} from the cumulative time limit for %{original_round_id}. WST knows about this bug (GitHub issue #3254)."

  def initialize(competition_id, check_real_results = false)
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
      rounds: [],
      events: [],
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

    @competition = Competition.includes(associations).find(competition_id)

    @check_real_results = check_real_results

    result_model = @check_real_results ? Result : InboxResult
    @results = result_model.sorted_for_competitions(competition_id)
    @has_results = @results.any?
    unless @has_results
      @total_errors = 1
      @errors[:results] << "The competition has no result."
      return
    end

    @persons = if @check_real_results
                 @competition.competitors
               else
                 InboxPerson.where(competitionId: competition_id)
               end

    @scrambles = Scramble.where(competitionId: competition_id)

    # check persons
    # basic checks on persons are done in the model, uniqueness for a given competition
    # is done in the SQL schema.

    # Map a personId to its corresponding object.
    # When dealing with Persons from "InboxPerson" they are indexed by "id",
    # whereas when dealing with Persons from "Person" they are indexed by "wca_id".
    @persons_by_id = Hash[@persons.map { |person| [@check_real_results ? person.wca_id : person.id, person] }]

    # Map a competition's (expected!) round id (eg: "444-f") to its corresponding object
    @expected_rounds_by_ids = Hash[@competition.competition_events.map(&:rounds).flatten.map { |r| ["#{r.event.id}-#{r.round_type_id}", r] }]

    # Group actual results by their round id
    results_by_round_id = @results.group_by { |r| "#{r.eventId}-#{r.roundTypeId}" }

    # Ensure any call to localizable name (eg: round names) is made in English,
    # as all errors and warnings are in English.
    I18n.with_locale(:en) do
      check_persons

      check_events_match(@competition.events)

      check_main_event

      # Ensure retro-compatibility for "old" competitions without rounds.
      if @competition.has_rounds?
        check_rounds_match
      end

      check_advancement_conditions(results_by_round_id, @competition.competition_events)
      check_scrambles

      check_competitor_limit

      validator_classes = [ResultsValidators::PositionsValidator, ResultsValidators::IndividualResultsValidator]
      merge(validator_classes.map { |v| v.new.validate(results: @results) })
    end

    @total_errors = @errors.values.sum(&:size)
    @total_warnings = @warnings.values.sum(&:size)
  end

  private

  def merge(other_validators)
    unless other_validators.respond_to?(:each)
      other_validators = [other_validators]
    end
    other_validators.each do |v|
      v.errors.group_by(&:kind).each do |kind, errors|
        @errors[kind].concat(errors)
      end
      v.warnings.group_by(&:kind).each do |kind, warnings|
        @warnings[kind].concat(warnings)
      end
    end
    @total_errors = @errors.values.sum(&:size)
    @total_warnings = @warnings.values.sum(&:size)
  end

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
      reference_solve_times = reference.solve_times
      # We attribute 1 point for each similar solve_time, we then just have to count the points.
      score = r.solve_times.each_with_index.count do |solve_time, solve_time_index|
        solve_time.complete? && solve_time == reference_solve_times[solve_time_index]
      end
      # We have at least 3 matching values, consider this similar
      if score > 2
        similar_results << r
      end
    end
    similar_results
  end

  def check_main_event
    events_in_results = @results.map(&:eventId).uniq
    unless events_in_results.include?("333")
      @warnings[:events] << CHOOSE_MAIN_EVENT_WARNING
    end
  end

  def check_events_match(competition_events)
    # Check for missing/unexpected events
    # As events must be validated by WCAT, any missing or unexpected event should lead to an error.
    expected = competition_events.map(&:id)
    real = @results.map(&:eventId).uniq
    (real - expected).each do |event_id|
      @errors[:events] << format(UNEXPECTED_RESULTS_ERROR, event_id: event_id)
    end
    (expected - real).each do |event_id|
      @warnings[:events] << format(MISSING_RESULTS_WARNING, event_id: event_id)
    end
  end

  def check_rounds_match
    # Check that rounds match what was declared.
    # This function automatically casts combined rounds to regular rounds if everyone has met the cutoff.
    expected = @expected_rounds_by_ids.keys
    real = @results.map { |r| "#{r.eventId}-#{r.roundTypeId}" }.uniq
    unexpected = real - expected
    missing = expected - real
    missing.each do |round_id|
      event_id, round_type_id = round_id.split("-")
      equivalent_round_id = "#{event_id}-#{RoundType.toggle_cutoff(round_type_id)}"
      if unexpected.include?(equivalent_round_id)
        unexpected.delete(equivalent_round_id)
        round = @expected_rounds_by_ids[round_id]
        if round.round_type.combined?
          # NOTE: we cannot know if everyone legitimately cleared the cutoff,
          # or if the cutoff was removed during the competition and not
          # updated on the website's schedule. So we just consider it fine,
          # but we have to update the expected round information so that we have
          # a valid round_info when checking individual results later.
          @expected_rounds_by_ids[equivalent_round_id] = @expected_rounds_by_ids.delete(round_id)
        else
          @errors[:rounds] << format(UNEXPECTED_COMBINED_ROUND_ERROR, round_name: round.name)
        end
      else
        @errors[:rounds] << format(MISSING_ROUND_RESULTS_ERROR, round_id: round_id)
      end
    end
    unexpected.each do |round_id|
      @errors[:rounds] << format(UNEXPECTED_ROUND_RESULTS_ERROR, round_id: round_id)
    end
  end

  def check_advancement_conditions(results_by_round_id, competition_events)
    results_by_event_id = @results.group_by(&:eventId)
    results_by_event_id.each do |event_id, results|
      results_by_event_id[event_id] = results.group_by(&:roundTypeId)
    end
    ordered_round_type_ids = RoundType.order(:rank).all.map(&:id)
    results_by_event_id.each do |event_id, results_by_round_type_id|
      remaining_number_of_rounds = results_by_round_type_id.keys.size
      if remaining_number_of_rounds > 4
        # https://www.worldcubeassociation.org/regulations/#9m: Events must have at most four rounds.
        # Should not happen as we already have a validation to create rounds, but who knows...
        @errors[:rounds] << format(REGULATION_9M_ERROR, event_id: event_id)
      end
      number_of_people_in_previous_round = nil
      (ordered_round_type_ids & results_by_round_type_id.keys).each do |round_type_id|
        remaining_number_of_rounds -= 1
        number_of_people_in_round = results_by_round_type_id[round_type_id].size
        round_id = "#{event_id}-#{round_type_id}"
        if number_of_people_in_round <= 7 && remaining_number_of_rounds > 0
          # https://www.worldcubeassociation.org/regulations/#9m3: Rounds with 7 or fewer competitors must not have subsequent rounds.
          @errors[:rounds] << format(REGULATION_9M3_ERROR, round_id: round_id)
        end
        if number_of_people_in_round <= 15 && remaining_number_of_rounds > 1
          # https://www.worldcubeassociation.org/regulations/#9m2: Rounds with 15 or fewer competitors must have at most one subsequent round.
          @errors[:rounds] << format(REGULATION_9M2_ERROR, round_id: round_id)
        end
        if number_of_people_in_round <= 99 && remaining_number_of_rounds > 2
          # https://www.worldcubeassociation.org/regulations/#9m1: Rounds with 99 or fewer competitors must have at most one subsequent round.
          @errors[:rounds] << format(REGULATION_9M1_ERROR, round_id: round_id)
        end

        # Check for the number of qualified competitors (only if we are not
        # in a first round).
        if number_of_people_in_previous_round
          # Article 9p, since July 20, 2006 until April 13, 2010
          if Date.new(2006, 7, 20) <= @competition.start_date &&
             @competition.start_date <= Date.new(2010, 4, 13)
            if number_of_people_in_round >= number_of_people_in_previous_round
              @errors[:rounds] << format(OLD_REGULATION_9P_ERROR, round_id: round_id)
            end
          else
            # Article 9p1, since April 14, 2010
            # https://www.worldcubeassociation.org/regulations/#9p1: At least 25% of competitors must be eliminated between consecutive rounds of the same event.
            if number_of_people_in_round > 3 * number_of_people_in_previous_round / 4
              @errors[:rounds] << format(REGULATION_9P1_ERROR, round_id: round_id)
            end
          end
        end
        number_of_people_in_previous_round = number_of_people_in_round
      end
    end
  end

  def check_scrambles
    # Get actual round ids from results
    rounds_ids = @results.map { |r| "#{r.eventId}-#{r.roundTypeId}" }.uniq

    # Group scramble by round_id
    scrambles_by_round_id = @scrambles.group_by { |s| "#{s.eventId}-#{s.roundTypeId}" }
    detected_scrambles_rounds_ids = scrambles_by_round_id.keys
    (rounds_ids - detected_scrambles_rounds_ids).each do |round_id|
      @errors[:scrambles] << format(MISSING_SCRAMBLES_FOR_ROUND_ERROR, round_id: round_id)
    end

    (detected_scrambles_rounds_ids - rounds_ids).each do |round_id|
      @errors[:scrambles] << format(UNEXPECTED_SCRAMBLES_FOR_ROUND_ERROR, round_id: round_id)
    end

    # For existing rounds and scrambles matching expected rounds in the WCA website,
    # check that the number of scrambles match at least the number of expected scrambles.
    (detected_scrambles_rounds_ids & @expected_rounds_by_ids.keys).each do |round_id|
      format = @expected_rounds_by_ids[round_id].format
      expected_number_of_scrambles = format.expected_solve_count
      scrambles_by_group_id = scrambles_by_round_id[round_id].group_by(&:groupId)
      scrambles_by_group_id.each do |group_id, scrambles_for_group|
        # filter out extra scrambles
        actual_number_of_scrambles = scrambles_for_group.reject(&:isExtra).size
        if actual_number_of_scrambles < expected_number_of_scrambles
          @errors[:scrambles] << format(MISSING_SCRAMBLES_FOR_GROUP_ERROR,
                                        round_id: round_id,
                                        group_id: group_id, actual: actual_number_of_scrambles,
                                        expected: expected_number_of_scrambles)
        end
      end
    end
  end

  def check_persons
    detected_person_ids = @persons_by_id.keys
    persons_with_results = @results.map(&:personId)
    (detected_person_ids - persons_with_results).each do |person_id|
      @errors[:persons] << format(PERSON_WITHOUT_RESULTS_ERROR, person_id: person_id, person_name: @persons_by_id[person_id].name)
    end
    (persons_with_results - detected_person_ids).each do |person_id|
      @errors[:persons] << format(RESULTS_WITHOUT_PERSON_ERROR, person_id: person_id)
    end

    without_wca_id, with_wca_id = @persons_by_id.values.partition { |p| p.wca_id.empty? }
    if without_wca_id.any?
      existing_person_in_db_by_name = Person.where(name: without_wca_id.map(&:name)).group_by(&:name)
      existing_person_in_db_by_name.each do |name, persons|
        @warnings[:persons] << format(SAME_PERSON_NAME_WARNING, name: name, wca_ids: persons.map(&:wca_id).join(", "))
      end
    end
    without_wca_id.each do |p|
      if p.dob.month == 1 && p.dob.day == 1
        @warnings[:persons] << format(DOB_0101_WARNING, name: p.name)
      end
      # Competitor less than 3 years old are extremely rare, so we'd better check these birthdate are correct
      if p.dob.year >= Time.now.year - 3
        @warnings[:persons] << format(VERY_YOUNG_PERSON_WARNING, name: p.name)
      end
      # Look for double whitespaces or leading/trailing whitespaces
      unless p.name.squeeze(" ").strip == p.name
        @errors[:persons] << format(WHITESPACE_IN_NAME_ERROR, name: p.name)
      end
      if /[[:alnum:]]\(/ =~ p.name
        @errors[:persons] << format(WRONG_PARENTHETHIS_FORMAT_ERROR, name: p.name)
      end
    end
    existing_person_by_wca_id = Hash[Person.current.where(wca_id: with_wca_id.map(&:wca_id)).map { |p| [p.wca_id, p] }]
    with_wca_id.each do |p|
      existing_person = existing_person_by_wca_id[p.wca_id]
      if existing_person
        # WRT wants to show warnings for wrong person information.
        # (If I get this right, we do not actually update existing persons from InboxPerson)
        unless p.dob == existing_person.dob
          @warnings[:persons] << format(NON_MATCHING_DOB_WARNING, name: p.name, wca_id: p.wca_id, expected_dob: existing_person.dob, dob: p.dob)
        end
        unless p.gender == existing_person.gender
          @warnings[:persons] << format(NON_MATCHING_GENDER_WARNING, name: p.name, wca_id: p.wca_id, expected_gender: existing_person.gender, gender: p.gender)
        end
        unless p.name == existing_person.name
          @warnings[:persons] << format(NON_MATCHING_NAME_WARNING, name: p.name, wca_id: p.wca_id, expected_name: existing_person.name)
        end
        unless p.country.id == existing_person.country.id
          @warnings[:persons] << format(NON_MATCHING_COUNTRY_WARNING, name: p.name, wca_id: p.wca_id, expected_country: existing_person.country_iso2, country: p.countryId)
        end
      else
        @errors[:persons] << format(WRONG_WCA_ID_ERROR, name: p.name, wca_id: p.wca_id)
      end
    end
  end

  def check_competitor_limit
    if @competition.competitor_limit && @persons.size > @competition.competitor_limit
      @warnings[:persons] << format(COMPETITOR_LIMIT_WARNING, n_competitors: @persons.size, competitor_limit: @competition.competitor_limit)
    end
  end
end
