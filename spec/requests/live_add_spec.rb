# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "POST #add_result" do
    let!(:delegate) { create(:delegate) }

    it "Adds the Live Result Correctly" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")
      registration = create(:registration, :accepted, competition: competition)
      round.open_round!

      live_request = {
        attempts: [111, 222, 333, 444, 555],
        registration_id: registration.id,
      }

      post add_live_result_path(competition.id, round.id), params: live_request
      expect(response).to be_successful
      perform_enqueued_jobs

      result = LiveResult.find_by(round_id: round.id, registration_id: registration.id)
      expect(result).to be_present

      expect(result.live_attempts.map { |l| { attempt_number: l.attempt_number, value: l.value } }).to contain_exactly({ attempt_number: 1, value: 111 },
                                                                                                                       { attempt_number: 2, value: 222 },
                                                                                                                       { attempt_number: 3, value: 333 },
                                                                                                                       { attempt_number: 4, value: 444 },
                                                                                                                       { attempt_number: 5, value: 555 })
      expect(result.best).to eq 111
      expect(result.average).to eq 333
    end

    it "Can't add result if round isn't open yet" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")
      registration = create(:registration, :accepted, competition: competition)

      live_request = {
        attempts: [111, 222, 333, 444, 555],
        registration_id: registration.id,
      }

      post add_live_result_path(competition.id, round.id), params: live_request
      expect(response).not_to be_successful
    end

    it "Can't add result for a competitor that isn't in that round" do
      sign_in delegate

      competition = create(:competition, event_ids: %w[333 444], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")
      create(:registration, :accepted, competition: competition)
      registration = create(:registration, :accepted, competition: competition, event_ids: ["444"])
      round.open_round!

      live_request = {
        attempts: [111, 222, 333, 444, 555],
        registration_id: registration.id,
      }

      post add_live_result_path(competition.id, round.id), params: live_request
      expect(response).not_to be_successful
      expect(response.parsed_body["status"]).to eq "user is not part of this round"
    end
  end
end
