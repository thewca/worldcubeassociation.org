# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #round_results" do
    let!(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"]) }
    let!(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }
    let(:round) { create(:round, number: 1, event_id: "333", competition: competition) }

    before { round.open_and_lock_previous(User.first) }

    it "answers an unchanged poll with a 304" do
      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id)

      expect(response).to have_http_status(:ok)
      etag = response.headers["ETag"]
      expect(etag).to be_present

      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id), headers: { "If-None-Match" => etag }

      expect(response).to have_http_status(:not_modified)
      expect(response.body).to be_empty
    end

    it "serves the same body to a client without the ETag" do
      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id)
      first_body = response.body

      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id)

      expect(response).to have_http_status(:ok)
      expect(response.body).to eq(first_body)
    end

    it "serves the new results once a result changed" do
      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id)
      etag = response.headers["ETag"]
      previous_state_hash = response.parsed_body["state_hash"]

      result = round.live_results.find_by!(registration_id: registrations.first)
      attempts = Array.new(5) { |i| { value: 300, attempt_number: i + 1 } }
      UpdateLiveResultJob.perform_now(result, attempts, User.first.id)

      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id), headers: { "If-None-Match" => etag }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["state_hash"]).not_to eq(previous_state_hash)
    end
  end
end
