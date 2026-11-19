# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  let!(:delegate) { create(:delegate) }
  let(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
  let!(:registration) { create(:registration, :accepted, competition: competition, event_ids: ["333"]) }
  let!(:round) { create(:round, competition: competition, event_id: "333") }

  before { round.open_round!(delegate) }

  describe "GET #rounds" do
    it "lists the rounds of the competition" do
      get api_v1_competition_live_live_admin_path(competition.id)

      expect(response).to be_successful
      expect(response.parsed_body["rounds"].pluck("id")).to eq([round.wcif_id])
    end
  end

  describe "GET #round_results" do
    it "returns the round with its live results" do
      get api_v1_competition_live_live_round_results_path(competition.id, round.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["results"].pluck("registration_id")).to eq([registration.id])
    end
  end
end
