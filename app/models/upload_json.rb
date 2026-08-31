# frozen_string_literal: true

class UploadJson
  include ActiveModel::Model

  attr_accessor :results_json_str, :competition_id, :is_wcif

  validates :competition_id, presence: true

  validate do
    if results_json_str
      begin
        # Parse the json first
        if is_wcif
          import_version = parsed_json["formatVersion"] || Competition::WCIF_STABLE_VERSION
          Competition.validate_wcif_schema!(parsed_json, version: import_version)
        else
          JSON::Validator.validate!(ResultsValidators::JSONSchemas::RESULT_JSON_SCHEMA, parsed_json)
        end

        # check the ID registered in the JSON next
        json_competition_id = is_wcif ? parsed_json['id'] : parsed_json['competitionId']
        errors.add(:results_file, "is not for this competition but for #{json_competition_id}!") if json_competition_id != competition_id
      rescue JSON::ParserError
        errors.add(:results_file, is_wcif ? "must be a valid JSON file" : "must be a JSON file from the Workbook Assistant")
      rescue JSON::Schema::ValidationError => e
        errors.add(:results_file, "has errors: #{e.message}")
      end
    else
      errors.add(:results_file, "can't be blank")
    end
  end

  def parsed_json
    @parsed_json ||= JSON.parse(results_json_str)
  end

  def results_file=(results_file)
    self.results_json_str = results_file.read
    results_file.rewind
  end

  # rubocop:disable-next Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def temporary_results_data
    competition = Competition.includes(competition_events: [:rounds]).find(competition_id)
    persons_to_import = []

    registrations_data.each do |p|
      new_person_attributes = {
        id: [competition_id, p[is_wcif ? "registrantId" : "id"]],
        wca_id: p["wcaId"],
        name: p["name"],
        country_iso2: p[is_wcif ? "countryIso2" : "countryId"],
        gender: p["gender"],
        dob: p[is_wcif ? "birthdate" : "dob"],
      }
      # mask uploaded DOB on staging to avoid accidentally importing PII
      new_person_attributes["dob"] = "1954-12-04" if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
      persons_to_import << InboxPerson.new(new_person_attributes)
    end

    results_to_import = []
    scramble_sets_to_import = []

    parsed_json["events"].each do |event|
      competition_event = competition.competition_events.find { |ce| ce.event_id == event[is_wcif ? "id" : "eventId"] }
      event["rounds"].each do |round|
        # H2H results are skipped, as they get imported via a manual import process. See #13200 for more information
        next if round['formatId'] == "h"

        if is_wcif
          round_number = ScheduleActivity.parse_activity_code(round["id"])[:round_number]
          competition_round = competition_event.rounds.find_by!(number: round_number)
          round_type_id = competition_round.round_type_id
        else
          # Find the corresponding competition round and get the actual round_type_id
          # (in case the incoming one doesn't correspond to cutoff presence).
          incoming_round_type_id = round["roundId"]
          competition_round = competition_event.rounds.find do |cr|
            [incoming_round_type_id, RoundType.toggle_cutoff(incoming_round_type_id)].include?(cr.round_type_id)
          end
          round_type_id = competition_round&.round_type_id || incoming_round_type_id
        end

        # Import results for round
        round["results"].each do |result|
          if is_wcif
            import_version = parsed_json["formatVersion"] || Competition::WCIF_STABLE_VERSION
            individual_results = result["attempts"].map { it[LiveAttempt.wcif_result_field(import_version)] }
          else
            individual_results = result["results"]
          end

          # Pad the results with 0 up to 5 results
          individual_results.fill(0, individual_results.length...5)

          new_result_attributes = {
            person_id: result["personId"],
            pos: result[is_wcif ? "ranking" : "position"],
            # For non-linked rounds global_pos equals pos; linked rounds get recomputed during import.
            global_pos: result[is_wcif ? "ranking" : "position"],
            event_id: event[is_wcif ? "id" : "eventId"],
            round_type_id: round_type_id,
            format_id: round[is_wcif ? "format" : "formatId"],
            best: result["best"],
            average: result["average"],
            value1: individual_results[0],
            value2: individual_results[1],
            value3: individual_results[2],
            value4: individual_results[3],
            value5: individual_results[4],
          }
          new_res = InboxResult.new(new_result_attributes)
          # Using this way of setting the attribute saves two SELECTs per result
          # to validate the competition and round presence.
          # (a lot of time considering all the results to import!)
          new_res.competition = competition
          new_res.round = competition_round
          results_to_import << new_res
        end

        unless is_wcif
          # Import scrambles for round
          # I am too lazy to write actual parsing logic for A->1, B->2, ..., AA->27 etc.
          #   so this snippet is just "faking" the parse by using length-adjusted lexicographic sorting
          sorted_groups = round["groups"].sort_by { [it["group"].length, it["group"]] }
          sorted_groups.each_with_index do |group, group_idx|
            new_scramble_set_attributes = {
              ordered_index: group_idx,
            }
            new_scr_set = MatchedScrambleSet.new(new_scramble_set_attributes)
            new_scr_set.round = competition_round
            %w[scrambles extraScrambles].each do |scramble_type|
              group[scramble_type]&.each_with_index do |scramble, scr_index|
                new_scramble_attributes = {
                  scramble_string: scramble,
                  is_extra: scramble_type == "extraScrambles",
                  ordered_index: scr_index,
                }
                new_scr_set.matched_scrambles.build(new_scramble_attributes)
              end
            end
            scramble_sets_to_import << new_scr_set
          end
        end
      end
    end

    {
      results_to_import: results_to_import,
      scramble_sets_to_import: scramble_sets_to_import,
      persons_to_import: persons_to_import,
    }
  end

  def registrations_data
    return parsed_json["persons"] unless is_wcif

    parsed_json["persons"].select do |person|
      person.dig("registration", "status") == "accepted"
    end
  end
end
