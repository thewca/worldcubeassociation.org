# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ResultsSubmission do
  let(:results_submission) { FactoryBot.build(:results_submission) }

  it "is valid" do
    expect(results_submission).to be_valid
  end

  it "requires message" do
    results_submission.message = nil
    expect(results_submission).to be_invalid_with_errors(message: ["can't be blank"])
  end

  it "requires results_json_str is valid json" do
    results_submission.results_json_str = nil
    expect(results_submission).to be_invalid_with_errors(results_file: ["can't be blank"])

    results_submission.results_json_str = "this is invalid json"
    expect(results_submission).to be_invalid_with_errors(results_file: ["must be a JSON file from the Workbook Assistant"])
  end
end
