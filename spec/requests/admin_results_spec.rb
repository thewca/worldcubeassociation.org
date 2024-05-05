# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin Results" do
  describe "Posting Check In" do
    let!(:competition) { FactoryBot.create :competition, :with_valid_submitted_results }
    let!(:wrt_member) { FactoryBot.create :user, :wrt_member }

    it "locks a competition and returns the correct attributes" do
      sign_in wrt_member
      post start_posting_path, params: {
        'competition_ids' => [competition.id],
      }
      expect(response).to be_successful
      response_json = JSON.parse(response.body)
      expect(response_json["message"]).to eq "Competitions successfully locked, go on posting!"
      get results_posting_dashboard_path(format: :json)
      expect(response).to be_successful
      competitions = JSON.parse(response.body)["competitions"]
      expect(competitions.size).to eq 1
      expect(competitions[0]["id"]).to eq competition.id
      expect(competitions[0]["posting_user"]["id"]).to eq wrt_member.id
    end
  end
end
