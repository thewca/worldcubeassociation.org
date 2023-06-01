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

  it "fixes round_type_id in case it doesn't match the actual competition round data" do
    round = FactoryBot.create(:round, number: 1, event_id: "333", cutoff: nil)
    competition = round.competition

    results_json = {
      "formatVersion" => "WCA Competition 0.3",
      "competitionId" => competition.id,
      "persons" => [
        {
          id: 1,
          name: "Sherlock Holmes",
          wcaId: "2020HOLM01",
          countryId: "GB",
          gender: "m",
          dob: "2000-01-01",
        },
      ],
      "events" => [
        {
          "eventId" => "333",
          "rounds" => [
            {
              "roundId" => "c", # Says combined, even though there should be no cutoff.
              "formatId" => "a",
              "results" => [
                {
                  "personId" => 1,
                  "position" => 1,
                  "results" => [900, 900, 800, 1000, 900],
                  "best" => 800,
                  "average" => 900,
                },
              ],
              groups: [],
            },
          ],
        },
      ],
    }.to_json

    upload_json = FactoryBot.build(:upload_json, competition_id: competition.id, results_json_str: results_json)

    expect(upload_json.import_to_inbox).to eq true
    expect(InboxResult.count).to eq 1
    inbox_result = InboxResult.first
    # There is no cutoff, so the incoming round_type_id "c" should be converted to "f"
    expect(inbox_result.round_type_id).to eq "f"
  end
end
