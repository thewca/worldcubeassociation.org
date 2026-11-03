# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API - close_round" do
  describe "DELETE #close_round" do
    let!(:delegate) { create(:delegate) }

    def finish_round!(round, user)
      round.open_round!(user)
      round.live_results.update_all(live_attempts_count: round.format.expected_solve_count, advancing: true)
    end

    it "unlocks the previous round" do
      sign_in delegate

      competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)
      round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
      round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round1)

      finish_round!(round1, delegate)
      round2.open_and_lock_previous(delegate)
      expect(round1.lifecycle_state).to eq Round::STATE_LOCKED

      delete api_v1_competition_live_live_round_close_path(competition.id, round2.wcif_id)

      expect(response).to be_successful
      expect(round1.reload.lifecycle_state).to eq Round::STATE_OPEN
      expect(LiveResultHistoryEntry.where(live_result: round1.live_results).action_type_unlocked.count).to eq 1
    end

    it "unlocks all rounds of a linked previous round" do
      sign_in delegate

      competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)

      linked_round = create(:linked_round)
      round1_1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3, linked_round: linked_round)
      round1_2 = create(:round, competition: competition, event_id: "333", number: 2, linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: linked_round)

      finish_round!(round1_1, delegate)
      finish_round!(round1_2, delegate)
      round2.open_and_lock_previous(delegate)

      delete api_v1_competition_live_live_round_close_path(competition.id, round2.wcif_id)

      expect(response).to be_successful
      expect(round1_1.reload.lifecycle_state).to eq Round::STATE_OPEN
      expect(round1_2.reload.lifecycle_state).to eq Round::STATE_OPEN
    end
  end
end
