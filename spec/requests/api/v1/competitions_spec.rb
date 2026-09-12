# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 Competitions" do
  let(:competition) { create(:competition, :visible, :results_posted, events: Event.where(id: '333')) }

  describe "GET #results" do
    let!(:round) { create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 1) }
    let!(:result) { create(:result, competition: competition, event_id: "333", round: round, pos: 1, global_pos: 1) }

    it "is reachable without logging in" do
      get api_v1_competition_results_path(competition)

      expect(response).to be_successful
    end

    it "nests the results inside their round" do
      get api_v1_competition_results_path(competition)

      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json.first).to include(
        "wcif_id" => "333-r1",
        "event_id" => "333",
        "round_type_id" => "f",
        "format_id" => "a",
        "ranking_mode" => "round",
      )
      expect(json.first["results"].pluck("id")).to eq [result.id]
    end

    it "does not repeat the round's context on each result" do
      get api_v1_competition_results_path(competition)

      expect(response.parsed_body.first["results"].first.keys)
        .not_to include("event_id", "round_type_id", "format_id", "competition_id")
    end

    it "omits the linked round ids for a round that is not part of a Dual Round" do
      get api_v1_competition_results_path(competition)

      expect(response.parsed_body.first).not_to have_key("linked_round_wcif_ids")
    end
  end

  describe "Dual Rounds" do
    let!(:first_round) { create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2) }
    let!(:final_round) { create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2) }

    let(:alice) { create(:person, name: "Alice Cuber") }
    let(:bob) { create(:person, name: "Bob Cuber") }
    let(:carol) { create(:person, name: "Carol Cuber") }

    before do
      create(:linked_round, rounds: [first_round, final_round])

      # Each competitor counts with their better average, which is 10.00 for alice, 15.00 for carol
      # and 20.00 for bob, so the podium is alice, carol, bob. Neither round ranks them that way on
      # its own, which is what `global_pos` exists to express.
      create(:result, person: alice, competition: competition, event_id: "333", round: first_round, round_type_id: "1", best: 500, average: 1000, pos: 1, global_pos: 1)
      create(:result, person: bob, competition: competition, event_id: "333", round: first_round, round_type_id: "1", best: 1500, average: 3000, pos: 2, global_pos: 3)
      create(:result, person: carol, competition: competition, event_id: "333", round: first_round, round_type_id: "1", best: 2500, average: 5000, pos: 3, global_pos: 2)
      create(:result, person: carol, competition: competition, event_id: "333", round: final_round, round_type_id: "f", best: 750, average: 1500, pos: 1, global_pos: 2)
      create(:result, person: bob, competition: competition, event_id: "333", round: final_round, round_type_id: "f", best: 1000, average: 2000, pos: 2, global_pos: 3)
      create(:result, person: alice, competition: competition, event_id: "333", round: final_round, round_type_id: "f", best: 2000, average: 4000, pos: 3, global_pos: 1)
    end

    it "marks both rounds as a Dual Round and names the whole link" do
      get api_v1_competition_results_path(competition)

      json = response.parsed_body
      expect(json.pluck("wcif_id")).to eq %w[333-r1 333-r2]
      expect(json.pluck("ranking_mode")).to eq %w[linked_round linked_round]
      expect(json.pluck("linked_round_wcif_ids")).to eq [%w[333-r1 333-r2], %w[333-r1 333-r2]]
    end

    it "carries the round position and the position across both rounds on every result" do
      get api_v1_competition_results_path(competition)

      first_round_results = response.parsed_body.first["results"]
      expect(first_round_results.map { [it["name"], it["pos"], it["global_pos"]] }).to eq [
        [alice.name, 1, 1],
        [bob.name, 2, 3],
        [carol.name, 3, 2],
      ]
    end

    it "ranks the podium across both rounds, keeping each competitor's better result" do
      get api_v1_competition_podiums_path(competition)

      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json.first).to include("event_id" => "333", "format_id" => "a", "ranking_mode" => "linked_round")
      expect(json.first["results"].map { [it["name"], it["global_pos"], it["average"]] }).to eq [
        [alice.name, 1, 1000],
        [carol.name, 2, 1500],
        [bob.name, 3, 2000],
      ]
    end
  end
end
