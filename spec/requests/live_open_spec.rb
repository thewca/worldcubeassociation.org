# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API - open_round" do
  describe "PUT #open_round" do
    let!(:delegate) { create(:delegate) }

    def finish_round!(round, user)
      round.open_round!(user)
      round.live_results.update_all(live_attempts_count: round.format.expected_solve_count, advancing: true)
    end

    it "opens a normal first round and creates live results" do
      sign_in delegate

      competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
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

      competition = create(:competition, scoretaking_software: :internal, event_ids: %w[333 444], delegates: [delegate])
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

      competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
      create(:registration, :accepted, competition: competition)
      round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
      round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round1)

      # Open round 1 but don't enter any results → score_taking not done
      round1.open_round!(delegate)

      put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

      expect(response).not_to be_successful
      expect(response.parsed_body["status"]).to eq "score taking is not finished in the previous round"
    end

    it "does not allow opening the third round if one round of a dual round isn't done" do
      sign_in delegate

      competition = create(:competition, scoretaking_software: :internal, event_ids: %w[333 444], delegates: [delegate])
      create(:registration, :accepted, competition: competition, event_ids: %w[333 444])

      linked_round = create(:linked_round)
      round1_333_1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3, linked_round: linked_round)
      round1_333_2 = create(:round, competition: competition, event_id: "333", number: 2, linked_round: linked_round)
      round2_333 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: linked_round)

      # Open both dual rounds and only finish one
      finish_round!(round1_333_1, delegate)
      round1_333_2.open_round!(delegate)

      put api_v1_competition_live_live_round_open_path(competition.id, round2_333.wcif_id)

      expect(response).not_to be_successful
      expect(response.parsed_body["status"]).to eq "score taking is not finished in the previous round"
    end

    it "allows opening the third round after both rounds of a dual round are done" do
      sign_in delegate

      competition = create(:competition, scoretaking_software: :internal, event_ids: %w[333 444], delegates: [delegate])
      create_list(:registration, 8, :accepted, competition: competition, event_ids: %w[333 444])

      linked_round = create(:linked_round)
      round1_333_1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3, linked_round: linked_round)
      round1_333_2 = create(:round, competition: competition, event_id: "333", number: 2, linked_round: linked_round)
      round2_333 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: linked_round)

      # Open both dual rounds and simulate all results being entered
      finish_round!(round1_333_1, delegate)
      finish_round!(round1_333_2, delegate)

      put api_v1_competition_live_live_round_open_path(competition.id, round2_333.wcif_id)

      expect(response).to be_successful
      expect(response.parsed_body["status"]).to eq "ok"
      expect(round2_333.live_results.count).to eq 8
      expect(round1_333_1).to be_locked
      expect(round1_333_2).to be_locked
    end

    describe "allows round to open per Regulation 9m" do
      it "if the round is a first round (9m does not apply to registrations)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 7, :accepted, competition: competition)

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)

        put api_v1_competition_live_live_round_open_path(competition.id, round1.wcif_id)

        expect(response).to be_successful
        expect(response.parsed_body["status"]).to eq "ok"
      end

      it "if the previous round has 8 competitors (9m3 satisfied)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 8, :accepted, competition: competition)

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round1)

        finish_round!(round1, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

        expect(response).to be_successful
        expect(response.parsed_body["status"]).to eq "ok"
      end

      it "if the previous round is part of the same LinkedRound (9m3 ignored)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 7, :accepted, competition: competition)

        linked_round = create(:linked_round)
        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2, linked_round: linked_round)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, linked_round: linked_round)

        # Round 1 of the link is open with no results entered yet
        round1.open_round!(delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

        expect(response).to be_successful
        expect(response.parsed_body["status"]).to eq "ok"
      end

      it "if the round 2 rounds ago has 16 competitors (9m2 satisfied)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 16, :accepted, competition: competition) # rubocop:disable FactoryBot/ExcessiveCreateList

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 3, participation_source: round1)
        round3 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: round2)

        finish_round!(round1, delegate)
        finish_round!(round2, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round3.wcif_id)

        expect(response).to be_successful
        expect(response.parsed_body["status"]).to eq "ok"
      end

      it "if the round 3 rounds ago has 100 competitors (9m1 satisfied)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 100, :accepted, competition: competition) # rubocop:disable FactoryBot/ExcessiveCreateList

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 4)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 4, participation_source: round1)
        round3 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 4, participation_source: round2)
        round4 = create(:round, competition: competition, event_id: "333", number: 4, total_number_of_rounds: 4, participation_source: round3)

        finish_round!(round1, delegate)
        finish_round!(round2, delegate)
        finish_round!(round3, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round4.wcif_id)

        expect(response).to be_successful
        expect(response.parsed_body["status"]).to eq "ok"
      end
    end

    describe "prevents round from opening per Regulation 9m" do
      it "if the previous round has 7 competitors (9m3 applies)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 7, :accepted, competition: competition)

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2, participation_source: round1)

        finish_round!(round1, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

        expect(response).not_to be_successful
        expect(response.parsed_body["status"]).to include("9m3")
      end

      it "if the previous round had 7 competitors, and was part of a LinkedRound which the current round is not a part of (9m3 applies)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 7, :accepted, competition: competition)

        linked_round = create(:linked_round)
        round1_1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3, linked_round: linked_round)
        round1_2 = create(:round, competition: competition, event_id: "333", number: 2, linked_round: linked_round)
        round2 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: linked_round)

        finish_round!(round1_1, delegate)
        finish_round!(round1_2, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round2.wcif_id)

        expect(response).not_to be_successful
        expect(response.parsed_body["status"]).to include("9m3")
      end

      it "if the round 2 rounds ago has 15 competitors (9m2 applies)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 15, :accepted, competition: competition) # rubocop:disable FactoryBot/ExcessiveCreateList

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 3)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 3, participation_source: round1)
        round3 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 3, participation_source: round2)

        finish_round!(round1, delegate)
        finish_round!(round2, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round3.wcif_id)

        expect(response).not_to be_successful
        expect(response.parsed_body["status"]).to include("9m2")
      end

      it "if the round 3 rounds ago has 99 competitors (9m1 applies)" do
        sign_in delegate

        competition = create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate])
        create_list(:registration, 99, :accepted, competition: competition) # rubocop:disable FactoryBot/ExcessiveCreateList

        round1 = create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 4)
        round2 = create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 4, participation_source: round1)
        round3 = create(:round, competition: competition, event_id: "333", number: 3, total_number_of_rounds: 4, participation_source: round2)
        round4 = create(:round, competition: competition, event_id: "333", number: 4, total_number_of_rounds: 4, participation_source: round3)

        finish_round!(round1, delegate)
        finish_round!(round2, delegate)
        finish_round!(round3, delegate)

        put api_v1_competition_live_live_round_open_path(competition.id, round4.wcif_id)

        expect(response).not_to be_successful
        expect(response.parsed_body["status"]).to include("9m1")
      end
    end
  end
end