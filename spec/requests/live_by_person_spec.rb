# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #by_person" do
    let(:competition) { create(:competition, :with_delegate, scoretaking_software: :internal, event_ids: ["333"]) }

    it "returns the competitor with their results" do
      registration = create(:registration, :accepted, competition: competition, event_ids: ["333"])
      round = create(:round, competition: competition, event_id: "333")
      round.open_round!(competition.delegates.first)

      get api_v1_competition_live_get_live_by_person_path(competition.id, registration.id)

      expect(response).to be_successful
      expect(response.parsed_body["results"].pluck("round_wcif_id")).to eq([round.wcif_id])
    end

    it "returns not found for a registration of another competition" do
      other_registration = create(:registration, :accepted, event_ids: ["333"])

      get api_v1_competition_live_get_live_by_person_path(competition.id, other_registration.id)

      expect(response).to have_http_status(:not_found)
    end
  end
end
