# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "PUT #add_competitor_to_round" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, scoretaking_software: :internal, event_ids: %w[333], delegates: [delegate]) }

    before { sign_in delegate }

    it "can't add a registration from another competition" do
      round = create(:round, competition: competition, event_id: "333")
      round.open_round!(delegate)
      other_registration = create(:registration, :pending)

      put api_v1_competition_live_add_competitor_to_round_path(competition.id, round.wcif_id, other_registration.id)

      expect(response).to have_http_status(:not_found)
      expect(LiveResult.where(registration_id: other_registration.id)).to be_empty
    end
  end
end
