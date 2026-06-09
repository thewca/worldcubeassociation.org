# frozen_string_literal: true

class UploadJson
  include ActiveModel::Model

  attr_accessor :results_json_str, :competition_id

  validates :competition_id, presence: true

  validate do
    if results_json_str
      begin
        # Parse the json first
        JSON::Validator.validate!(ResultsValidators::JSONSchemas::RESULT_JSON_SCHEMA, parsed_json)
        errors.add(:results_file, "is not for this competition but for #{parsed_json['competitionId']}!") if parsed_json["competitionId"] != competition_id
      rescue JSON::ParserError
        errors.add(:results_file, "must be a JSON file from the Workbook Assistant")
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

  def temporary_results_data
    competition = Competition.includes(competition_events: [:rounds]).find(competition_id)
    persons_to_import = []
    parsed_json["persons"].each do |p|
      new_person_attributes = {
        id: [p["id"], competition_id],
        wca_id: p["wcaId"],
        name: p["name"],
        country_iso2: p["countryId"],
        gender: p["gender"],
        dob: p["dob"],
      }
      # mask uploaded DOB on staging to avoid accidentally importing PII
      new_person_attributes["dob"] = "1954-12-04" if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
      persons_to_import << InboxPerson.new(new_person_attributes)
    end
    results_to_import = []
    scramble_sets_to_import = []
    parsed_json["events"].each do |event|
      competition_event = competition.competition_events.find { |ce| ce.event_id == event["eventId"] }
      event["rounds"].each do |round|
        # H2H results are skipped, as they get imported via a manual import process. See #13200 for more information
        next if round['formatId'] == "h"

        # Find the corresponding competition round and get the actual round_type_id
        # (in case the incoming one doesn't correspond to cutoff presence).
        incoming_round_type_id = round["roundId"]
        competition_round = competition_event.rounds.find do |cr|
          [incoming_round_type_id, RoundType.toggle_cutoff(incoming_round_type_id)].include?(cr.round_type_id)
        end
        round_type_id = competition_round&.round_type_id || incoming_round_type_id

        # Import results for round
        round["results"].each do |result|
          individual_results = result["results"]
          # Pad the results with 0 up to 5 results
          individual_results.fill(0, individual_results.length...5)
          new_result_attributes = {
            person_id: result["personId"],
            pos: result["position"],
            event_id: event["eventId"],
            round_type_id: round_type_id,
            format_id: round["formatId"],
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
    {
      results_to_import: results_to_import,
      scramble_sets_to_import: scramble_sets_to_import,
      persons_to_import: persons_to_import,
    }
  end
end
