# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scoretakers API" do
  let!(:delegate) { create(:delegate) }
  let!(:competition) { create(:competition, :with_valid_schedule, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
  let!(:competitor) { create(:user) }

  # Per the WCIF standard, scoretakers are the people with a `staff-dataentry` assignment.
  def assign_scoretaker(user)
    registration = create(:registration, :accepted, competition: competition, user: user)
    Assignment.create!(
      registration: registration,
      schedule_activity: competition.all_activities.first,
      assignment_code: Assignment::SCORETAKER_ASSIGNMENT_CODE,
    )
  end

  describe "determining scoretakers" do
    it "treats users with a staff-dataentry assignment as scoretakers" do
      assign_scoretaker(competitor)

      expect(competition.scoretakers).to include(competitor)
      expect(competitor.can_scoretake_competition?(competition)).to be true
    end

    it "does not treat users without that assignment as scoretakers" do
      create(:registration, :accepted, competition: competition, user: competitor)

      expect(competition.scoretakers).not_to include(competitor)
      expect(competitor.can_scoretake_competition?(competition)).to be false
    end
  end

  describe "scoretaking permission" do
    it "allows a designated scoretaker to submit results" do
      assign_scoretaker(competitor)
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
