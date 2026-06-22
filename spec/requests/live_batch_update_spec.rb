# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API batch submit" do
  describe "POST #batch_add_or_update_results" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
    let(:round) { create(:round, competition: competition, event_id: "333") }

    def attempts_for(value)
      [{ value: value, attempt_number: 1 }, { value: value, attempt_number: 2 }, { value: value, attempt_number: 3 }, { value: value, attempt_number: 4 }, { value: value, attempt_number: 5 }]
    end

    it "enqueues a single batch job and saves all results" do
      sign_in delegate

      reg_a = create(:registration, :accepted, competition: competition)
      reg_b = create(:registration, :accepted, competition: competition)
      create(:live_result, round: round, registration: reg_a)
      create(:live_result, round: round, registration: reg_b)

      batch_request = {
        results: [
          { registration_id: reg_a.id, attempts: attempts_for(111) },
          { registration_id: reg_b.id, attempts: attempts_for(222) },
        ],
      }

      expect do
        post api_v1_competition_live_batch_add_results_path(competition.id, round.wcif_id), params: batch_request
      end.to have_enqueued_job(BatchUpdateLiveResultJob).once
      expect(response).to be_successful

      perform_enqueued_jobs

      expect(LiveResult.find_by(round_id: round.id, registration_id: reg_a.id).best).to eq 111
      expect(LiveResult.find_by(round_id: round.id, registration_id: reg_b.id).best).to eq 222
    end

    it "fails the whole batch and enqueues nothing when an entry is invalid" do
      sign_in delegate

      reg_a = create(:registration, :accepted, competition: competition)
      reg_b = create(:registration, :accepted, competition: competition)
      create(:live_result, round: round, registration: reg_a)
      # reg_b has no live_result -> not part of round

      batch_request = {
        results: [
          { registration_id: reg_a.id, attempts: attempts_for(111) },
          { registration_id: reg_b.id, attempts: attempts_for(222) },
        ],
      }

      expect do
        post api_v1_competition_live_batch_add_results_path(competition.id, round.wcif_id), params: batch_request
      end.not_to have_enqueued_job(BatchUpdateLiveResultJob)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
