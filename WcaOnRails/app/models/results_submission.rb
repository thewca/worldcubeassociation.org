# frozen_string_literal: true

class ResultsSubmission
  include ActiveModel::Model

  attr_accessor :results_json_str, :message, :schedule_url, :competition_id

  validates :message, presence: true
  validates :competition_id, presence: true
  validates :schedule_url, presence: true, url: true

  validate do
    if !results_json_str
      errors.add(:results_file, "can't be blank")
    else
      begin
        # Parse the json first
        json = JSON.parse(results_json_str)
        JSON::Validator.validate!(CompetitionResultsValidator::RESULT_JSON_SCHEMA, json)
      rescue JSON::ParserError
        errors.add(:results_file, "must be a JSON file from the Workbook Assistant")
      rescue JSON::Schema::ValidationError => e
        errors.add(:results_file, "The JSON file had errors: #{e.message}")
      end
    end
  end

  def validate_results
    if valid?
      CompetitionResultsValidator.validate(JSON.parse(results_json_str), competition_id)
    else
      # Will error anyway
      {}
    end
  end

  def results_file=(results_file)
    self.results_json_str = results_file.read
    results_file.rewind
  end

  def ==(other)
    self.class == other.class && self.state == other.state
  end

  def state
    [results_json_str, message]
  end
end
