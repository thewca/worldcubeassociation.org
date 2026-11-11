# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #can_be_added_to_round" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, scoretaking_software: :internal, event_ids: %w[333 222], delegates: [delegate], allow_registration_edits: true) }
    let!(:in_event) { create(:registration, :accepted, competition: competition, event_ids: %w[333]) }
    let!(:not_in_event) { create(:registration, :accepted, competition: competition, event_ids: %w[222]) }

    before { sign_in delegate }

    it "returns every accepted competitor for a first round, even if not registered for the event" do
      round = create(:round, competition: competition, event_id: "333")

      get api_v1_competition_live_addable_competitors_for_round_path(competition.id, round.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["registrations"].pluck("id")).to contain_exactly(in_event.id, not_in_event.id)
    end

    it "only returns competitors from the previous round for subsequent rounds" do
      round_one = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
      round_two = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round_one)
      round_one.open_round!(delegate)

      get api_v1_competition_live_addable_competitors_for_round_path(competition.id, round_two.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["registrations"].pluck("id")).to contain_exactly(in_event.id)
    end
  end

  describe "PUT #add_competitor_to_round" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, scoretaking_software: :internal, event_ids: %w[333], delegates: [delegate]) }
    let!(:registration) { create(:registration, :accepted, competition: competition, event_ids: %w[333]) }

    it "adds the competitor to the open round" do
      sign_in delegate

      round = create(:round, competition: competition, event_id: "333")
      round.open_round!(delegate)
      late_registration = create(:registration, :accepted, competition: competition, event_ids: %w[333])

      put api_v1_competition_live_add_competitor_to_round_path(competition.id, round.wcif_id, late_registration.id), as: :json

      expect(response).to be_successful
      expect(response.parsed_body["competitor"]["id"]).to eq late_registration.id
      expect(round.live_results.pluck(:registration_id)).to contain_exactly(registration.id, late_registration.id)
    end
  end
end
