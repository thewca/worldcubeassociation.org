# frozen_string_literal: true

class UploadJson
  include ActiveModel::Model

  attr_accessor :results_json_str, :competition_id

  validates :competition_id, presence: true

  validate do
    if !results_json_str
      errors.add(:results_file, "can't be blank")
    else
      begin
        # Parse the json first
        JSON::Validator.validate!(CompetitionResultsValidator::RESULT_JSON_SCHEMA, parsed_json)
        if parsed_json["competitionId"] != competition_id
          errors.add(:results_file, "is not for this competition but for #{parsed_json["competitionId"]}!")
        end
      rescue JSON::ParserError
        errors.add(:results_file, "must be a JSON file from the Workbook Assistant")
      rescue JSON::Schema::ValidationError => e
        errors.add(:results_file, "has errors: #{e.message}")
      end
    end
  end

  def parsed_json
    @parsed_json ||= JSON.parse(results_json_str)
  end

  def results_file=(results_file)
    self.results_json_str = results_file.read
    results_file.rewind
  end

  # return true if successful, false if validation or record errors
  def import_to_inbox
    # This makes sure the json structure is valid!
    if valid?
      competition = Competition.find(competition_id)
      persons_to_import = []
      parsed_json["persons"].each do |p|
        new_person_attributes = p.merge(competitionId: competition_id)
        persons_to_import << InboxPerson.new(new_person_attributes)
      end
      results_to_import = []
      scrambles_to_import = []
      parsed_json["events"].each do |event|
        event["rounds"].each do |round|
          # Import results for round
          round["results"].each do |result|
            individual_results = result["results"]
            # Pad the results with 0 up to 5 results
            individual_results.fill(0, individual_results.length...5)
            new_result_attributes = {
              personId: result["personId"],
              pos: result["position"],
              eventId: event["eventId"],
              roundTypeId: round["roundId"],
              formatId: round["formatId"],
              best: result["best"],
              average: result["average"],
              value1: individual_results[0],
              value2: individual_results[1],
              value3: individual_results[2],
              value4: individual_results[3],
              value5: individual_results[4],
            }
            new_res = InboxResult.new(new_result_attributes)
            # Using this way of setting the attribute saves one SELECT per result
            # to validate the competition presence.
            # (a lot of time considering all the results to import!)
            new_res.competition = competition
            results_to_import << new_res
          end

          # Import scrambles for round
          round["groups"].each do |group|
            ["scrambles", "extraScrambles"].each do |scramble_type|
              group[scramble_type]&.each_with_index do |scramble, index|
                new_scramble_attributes = {
                  competitionId: competition_id,
                  eventId: event["eventId"],
                  roundTypeId: round["roundId"],
                  groupId: group["group"],
                  isExtra: scramble_type == "extraScrambles",
                  scrambleNum: index+1,
                  scramble: scramble,
                }
                scrambles_to_import << Scramble.new(new_scramble_attributes)
              end
            end
          end
        end
      end
      begin
        ActiveRecord::Base.transaction do
          InboxPerson.where(competitionId: competition_id).delete_all
          InboxResult.where(competitionId: competition_id).delete_all
          Scramble.where(competitionId: competition_id).delete_all
          InboxPerson.import!(persons_to_import)
          Scramble.import!(scrambles_to_import)
          InboxResult.import!(results_to_import)
        end
        true
      rescue ActiveRecord::RecordNotUnique
        errors.add(:results_file, "Duplicate record found while uploading results. Maybe there is a duplicate personId in the JSON?")
        false
      rescue ActiveRecord::RecordInvalid => e
        object = e.record
        if object.class == Scramble
          errors.add(:results_file, "Scramble in '#{Round.name_from_attributes_id(object.eventId, object.roundTypeId)}' is invalid (#{e.message}), please fix it!")
        elsif object.class == InboxPerson
          errors.add(:results_file, "Person #{object.name} is invalid (#{e.message}), please fix it!")
        elsif object.class == InboxResult
          errors.add(:results_file, "Result for person #{object.personId} in '#{Round.name_from_attributes_id(object.eventId, object.roundTypeId)}' is invalid (#{e.message}), please fix it!")
        else
          errors.add(:results_file, "An invalid record prevented the results from being created: #{e.message}")
        end
        false
      end
    else
      false
    end
  end
end
