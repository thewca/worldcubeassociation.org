# frozen_string_literal: true

class ResultsSubmission
  include ActiveModel::Model

  attr_accessor :results_json_str, :message

  validates :message, presence: true

  validate do
    if !results_json_str
      errors.add(:results_file, "can't be blank")
    elsif !valid_json?(results_json_str)
      errors.add(:results_file, "must be a JSON file from the Workbook Assistant")
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

# Copied and modified from https://stackoverflow.com/a/26235831
def valid_json?(json)
  JSON.parse(json)
  true
rescue JSON::ParserError
  false
end
