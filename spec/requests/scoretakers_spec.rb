# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scoretakers API" do
  let!(:delegate) { create(:delegate) }
  let!(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
  let!(:competitor) { create(:user) }

  describe "managing scoretakers" do
    it "lets a manager add and remove a scoretaker" do
      sign_in delegate

      post api_v1_competition_scoretakers_path(competition.id), params: { user_id: competitor.id }
      expect(response).to be_successful
      expect(competition.reload.scoretakers).to include(competitor)

      delete api_v1_competition_scoretaker_path(competition.id, competitor.id)
      expect(response).to be_successful
      expect(competition.reload.scoretakers).not_to include(competitor)
    end

    it "does not let a random user add a scoretaker" do
      sign_in create(:user)

      post api_v1_competition_scoretakers_path(competition.id), params: { user_id: competitor.id }
      expect(response).not_to be_successful
      expect(competition.reload.scoretakers).to be_empty
    end
  end

  describe "scoretaking permission" do
    it "allows a designated scoretaker to submit results" do
      competition.competition_scoretakers.create!(user: competitor)
      sign_in competitor

      round = create(:round, competition: competition, event_id: "333")
      registration = create(:registration, :accepted, competition: competition)
      round.open_round!(delegate)

      post api_v1_competition_live_add_results_path(competition.id, round.wcif_id), params: {
        attempts: [{ value: 111, attempt_number: 1 }],
        registration_id: registration.id,
      }
      expect(response).to be_successful
    end

    it "rejects a non-scoretaker submitting results" do
      sign_in competitor

      round = create(:round, competition: competition, event_id: "333")
      registration = create(:registration, :accepted, competition: competition)
      round.open_round!(delegate)

      post api_v1_competition_live_add_results_path(competition.id, round.wcif_id), params: {
        attempts: [{ value: 111, attempt_number: 1 }],
        registration_id: registration.id,
      }
      expect(response).not_to be_successful
    end
  end
end
