# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #round_results" do
    let!(:delegate) { FactoryBot.create :delegate }

    it "Returns the Live Reults correctly" do
      sign_in delegate

      competition = FactoryBot.create(:competition, event_ids: ["333"], delegates: [delegate])
      round = FactoryBot.create(:round, competition: competition, event_id: "333")
      registration = FactoryBot.create(:registration, :accepted, competition: competition)

      FactoryBot.create(:live_result, round: round, registration: registration)

      get live_round_results_api_path(competition.id, round.id)
      expect(response).to be_successful

      json = response.parsed_body
      expect(json.length).to eq 1
    end
  end
end
