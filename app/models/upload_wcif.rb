# frozen_string_literal: true

class UploadWcif
  include ActiveModel::Model

  attr_accessor :results_file_str, :competition_id

  validates :competition_id, presence: true

  validate do
    if results_file_str
      begin
        # Parse the json first
        import_version = parsed_json["formatVersion"] || Competition::WCIF_STABLE_VERSION
        Competition.validate_wcif_schema!(parsed_json, version: import_version)
        errors.add(:results_file, "is not for this competition but for #{parsed_json['id']}!") if parsed_json["id"] != competition_id
      rescue JSON::ParserError
        errors.add(:results_file, "must be a valid JSON file")
      rescue JSON::Schema::ValidationError => e
        errors.add(:results_file, "has errors: #{e.message}")
      end
    else
      errors.add(:results_file, "can't be blank")
    end
  end

  def parsed_json
    @parsed_json ||= JSON.parse(results_file_str)
  end

  def results_file=(results_file)
    self.results_file_str = results_file.read
    results_file.rewind
  end

  def temporary_results_data
    competition = Competition.includes(competition_events: [:rounds]).find(competition_id)
    persons_to_import = []
    
    import_version = parsed_json["formatVersion"] || Competition::WCIF_STABLE_VERSION

    parsed_json["persons"].each do |p|
      new_person_attributes = {
        id: [competition_id, p["registrantId"]],
        wca_id: p["wcaId"],
        name: p["name"],
        country_iso2: p["countryIso2"],
        gender: p["gender"],
        dob: p["birthdate"],
      }
      # mask uploaded DOB on staging to avoid accidentally importing PII
      new_person_attributes["dob"] = "1954-12-04" if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
      persons_to_import << InboxPerson.new(new_person_attributes)
    end

    results_to_import = []
    scramble_sets_to_import = []

    parsed_json["events"].each do |event|
      competition_event = competition.competition_events.find { |ce| ce.event_id == event["id"] }
      event["rounds"].each do |round|
        # H2H results are skipped
        next if round['format'] == "h"

        incoming_round_type_id = round["id"].split("-r").last
        
        # In WCIF, round id is something like `333-r1`
        # But we need `1`, `2`, `3` etc for `round_type_id`.
        competition_round = competition_event.rounds.find do |cr|
          [incoming_round_type_id, RoundType.toggle_cutoff(incoming_round_type_id)].include?(cr.round_type_id)
        end
        round_type_id = competition_round&.round_type_id || incoming_round_type_id

        # Import results for round
        round["results"].each do |result|
          individual_results = result["attempts"].map { |a| a[LiveAttempt.wcif_result_field(import_version)] }
          # Pad the results with 0 up to 5 results
          individual_results.fill(0, individual_results.length...5)
          
          new_result_attributes = {
            person_id: result["personId"],
            pos: result["ranking"],
            global_pos: result["ranking"],
            event_id: event["id"],
            round_type_id: round_type_id,
            format_id: round["format"],
            best: result["best"],
            average: result["average"],
            value1: individual_results[0],
            value2: individual_results[1],
            value3: individual_results[2],
            value4: individual_results[3],
            value5: individual_results[4],
          }
          new_res = InboxResult.new(new_result_attributes)
          new_res.competition = competition
          new_res.round = competition_round
          results_to_import << new_res
        end

        # Import scrambles for round
        # For full WCIF, it might just be scrambleSets
        if round["scrambleSets"].present?
          # Implement scramble set logic if needed
          # But since we're just reading results and usually scrambleSets are ignored during results import
          # We can leave this empty or implement similar to UploadJson if WCIF provides it.
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
    parsed_json["persons"].select do |person|
      person.dig("registration", "status") == "accepted"
    end.map(&:with_indifferent_access)
  end
end
