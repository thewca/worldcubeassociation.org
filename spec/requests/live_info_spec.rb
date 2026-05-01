# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API - rounds" do
  describe "GET #rounds" do
    let!(:delegate) { create(:delegate) }

    it "returns a pending state for a freshly created round" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      create(:round, competition: competition, event_id: "333", number: 1)

      get api_v1_competition_live_live_admin_path(competition.id)

      expect(response).to be_successful
      round_info = response.parsed_body["rounds"].first
      expect(round_info["state"]).to eq "pending"
      expect(round_info["ready"]).to be true
    end

    it "returns a ready flag when the participation source is done with score taking" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)
      round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
      round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round1)

      round1.open_round!(delegate)
      expected_solve_count = round1.format.expected_solve_count
      round1.live_results.update_all(live_attempts_count: expected_solve_count, advancing: true)

      get api_v1_competition_live_live_admin_path(competition.id)

      expect(response).to be_successful
      round2_info = response.parsed_body["rounds"].find { |r| r["id"] == round2.wcif_id }
      expect(round2_info["state"]).to eq "pending"
      expect(round2_info["ready"]).to be true
    end

    it "returns an open state with competitor counts after opening a round" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)
      round = create(:round, competition: competition, event_id: "333", number: 1)

      round.open_round!(delegate)

      get api_v1_competition_live_live_admin_path(competition.id)

      expect(response).to be_successful
      round_info = response.parsed_body["rounds"].first
      expect(round_info["state"]).to eq "open"
      expect(round_info["ready"]).to be false
      expect(round_info["total_competitors"]).to eq 1
      expect(round_info["competitors_live_results_entered"]).to eq 0
    end
  end
end
