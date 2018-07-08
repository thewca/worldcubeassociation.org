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
        json = JSON.parse(results_json_str)
        JSON::Validator.validate!(CompetitionResultsValidator::RESULT_JSON_SCHEMA, json)
        if json["competitionId"] != competition_id
          errors.add(:results_file, "this JSON file is not for this competition but for #{json["competitionId"]}!")
        end
      rescue JSON::ParserError
        errors.add(:results_file, "must be a JSON file from the Workbook Assistant")
      rescue JSON::Schema::ValidationError => e
        errors.add(:results_file, "The JSON file had errors: #{e.message}")
      end
    end
  end

  def results_file=(results_file)
    self.results_json_str = results_file.read
    results_file.rewind
  end

  # FIXME: what is this used for?
  def ==(other)
    self.class == other.class && self.state == other.state
  end

  def state
    [results_json_str]
  end
end
