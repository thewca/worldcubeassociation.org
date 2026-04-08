# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API - open_round" do
  describe "PUT #open_round" do
    let!(:delegate) { create(:delegate) }

    it "opens a normal first round and creates live results" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      round = create(:round, competition: competition, event_id: "333", number: 1)
      create(:registration, :accepted, competition: competition)

      put api_v1_competition_live_live_round_open_path(competition.id, round.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["status"]).to eq "ok"
      expect(response.parsed_body["created_rows"]).to be > 0
      expect(round.live_results.count).to eq 1
    end

    it "allows opening the first and second round of a linked (dual) round after each other" do
      sign_in delegate

      competition = create(:competition, event_ids: %w[333 444], delegates: [delegate])
      create(:registration, :accepted, competition: competition, event_ids: %w[333 444])

      linked_round = create(:linked_round)
      round1 = create(:round, competition: competition, event_id: "333", number: 1, linked_round: linked_round)
      round2 = create(:round, competition: competition, event_id: "444", number: 1, linked_round: linked_round)

      put api_v1_competition_live_live_round_open_path(competition.id, round1.wcif_id)
      expect(response).to be_successful
      expect(round1.live_results.count).to eq 1

      put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)
      expect(response).to be_successful
      expect(round2.live_results.count).to eq 1
    end

    it "does not allow opening a second round if the first round is not done yet" do
      sign_in delegate

      competition = create(:competition, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)
      round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
      round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2)

      # Open round 1 but don't enter any results → score_taking not done
      round1.open_round!(delegate)

      put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

      expect(response).not_to be_successful
      expect(response.parsed_body["status"]).to eq "score taking is not finished in the previous round"
    end

    it "allows opening the third round after both rounds of a dual round are done" do
      sign_in delegate

      competition = create(:competition, event_ids: %w[333 444], delegates: [delegate])
      create(:registration, :accepted, competition: competition, event_ids: %w[333 444])

      linked_round = create(:linked_round)
      round1_333 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2, linked_round: linked_round)
      round1_444 = create(:round, competition: competition, event_id: "444", number: 1, linked_round: linked_round)
      round2_333 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2)

      # Open both dual rounds and simulate all results being entered
      round1_333.open_round!(delegate)
      round1_444.open_round!(delegate)

      expected_solve_count = round1_333.format.expected_solve_count
      round1_333.live_results.update_all(live_attempts_count: expected_solve_count, advancing: true)
      round1_444.live_results.update_all(live_attempts_count: expected_solve_count, advancing: true)

      put api_v1_competition_live_live_round_open_path(competition.id, round2_333.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["status"]).to eq "ok"
      expect(round2_333.live_results.count).to eq 1
    end
  end
end
