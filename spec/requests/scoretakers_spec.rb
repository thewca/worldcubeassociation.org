# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scoretakers API" do
  let!(:delegate) { create(:delegate) }
  let!(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
  let!(:competitor) { create(:user) }

  describe "listing scoretaker candidates" do
    let(:candidate_user_ids) { response.parsed_body.pluck("user_id") }

    it "lists accepted and non-competing registrations" do
      accepted = create(:registration, :accepted, competition: competition)
      # Staff that are added through the WCIF are non-competing without ever being accepted
      non_competing = create(:registration, :non_competing, competing_status: 'pending', competition: competition)
      pending_registration = create(:registration, :pending, competition: competition)
      sign_in delegate

      get candidates_api_v1_competition_scoretakers_path(competition.id)
      expect(response).to be_successful
      expect(candidate_user_ids).to contain_exactly(accepted.user_id, non_competing.user_id)
      expect(candidate_user_ids).not_to include(pending_registration.user_id)
    end

    it "leaves out delegates and organizers, who can take scores anyway" do
      organizer = create(:user)
      competition.organizers << organizer
      create(:registration, :accepted, competition: competition, user: organizer)
      create(:registration, :accepted, competition: competition, user: delegate)
      sign_in delegate

      get candidates_api_v1_competition_scoretakers_path(competition.id)
      expect(response).to be_successful
      expect(candidate_user_ids).to be_empty
    end

    it "does not let a random user list candidates" do
      sign_in create(:user)

      get candidates_api_v1_competition_scoretakers_path(competition.id)
      expect(response).not_to be_successful
    end
  end

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
