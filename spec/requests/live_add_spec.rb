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

      live_request = {
        attempts: [{ result: 111, attempt_number: 1 }, { result: 222, attempt_number: 2}, { result: 333, attempt_number: 3 }, { result: 444, attempt_number: 4 }, { result: 555, attempt_number: 5 }],
        registration_id: registration.id,
      }

      post add_live_result_path(competition.id, round.id), params: live_request
      expect(response).to be_successful
      perform_enqueued_jobs

      result = LiveResult.find_by(round_id: round.id, registration_id: registration.id)
      expect(result).to be_present

      expect(result.live_attempts.map { |l| { attempt_number: l.attempt_number, result: l.result } }).to contain_exactly({ attempt_number: 1, result: 111 },
                                                                                                                         { attempt_number: 2, result: 222 },
                                                                                                                         { attempt_number: 3, result: 333 },
                                                                                                                         { attempt_number: 4, result: 444 },
                                                                                                                         { attempt_number: 5, result: 555 })
      expect(result.best).to eq 111
      expect(result.average).to eq 333
    end

    it "Can't add result if it already exist" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333")
      registration = create(:registration, :accepted, competition: competition)
      create(:live_result, round: round, registration: registration)
      live_request = {
        attempts: [{ result: 111, attempt_number: 1 }, { result: 222, attempt_number: 2}, { result: 333, attempt_number: 3 }, { result: 444, attempt_number: 4 }, { result: 555, attempt_number: 5 }],
        registration_id: registration.id,
      }

      post add_live_result_path(competition.id, round.id), params: live_request
      expect(response).not_to be_successful
    end
  end
end
