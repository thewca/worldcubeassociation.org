# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UploadJson do
  let(:upload_json) { FactoryBot.build(:upload_json) }

  it "is valid" do
    expect(upload_json).to be_valid
  end

  it "requires results_json_str is valid json" do
    upload_json.results_json_str = nil
    expect(upload_json).to be_invalid_with_errors(results_file: ["can't be blank"])

    upload_json.results_json_str = "this is invalid json"
    expect(upload_json).to be_invalid_with_errors(results_file: ["must be a JSON file from the Workbook Assistant"])
  end
end
