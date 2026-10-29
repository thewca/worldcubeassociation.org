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

  describe "GET #live" do
    it 'groups recent and future live results competitions by status' do
      upcoming = create(:competition, :visible, scoretaking_software: :internal, starts: 1.week.from_now)
      in_progress = create(:competition, :visible, scoretaking_software: :internal, starts: 1.day.ago, ends: 1.day.from_now)
      ended_two_weeks_ago = create(:competition, :visible, scoretaking_software: :internal, starts: 2.weeks.ago)
      ended_last_week = create(:competition, :visible, scoretaking_software: :internal, starts: 1.week.ago)
      create(:competition, :visible, scoretaking_software: :internal, starts: 2.months.ago)
      create(:competition, :visible, scoretaking_software: :wca_live, starts: 1.day.ago, ends: 1.day.from_now)

      get api_v1_live_competitions_path
      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json["upcoming"].pluck("id")).to eq([upcoming.id])
      expect(response_json["in_progress"].pluck("id")).to eq([in_progress.id])
      expect(response_json["past"].pluck("id")).to eq([ended_last_week.id, ended_two_weeks_ago.id])
    end
  end

  describe "GET #head_to_head" do
    let!(:competition) { create(:competition, :visible, with_rounds: true, h2h_finals_event_ids: ['333']) }
    let!(:round) { competition.competition_events.find_by(event_id: "333").rounds.first }
    let!(:users) { create_list(:user_with_wca_id, 2) }
    let!(:registrations) { users.map { create(:registration, competition: competition, user: it) } }
    let!(:match) { round.h2h_matches.create!(match_number: 1) }
    let!(:competitors) { users.map { match.h2h_match_competitors.create!(user: it) } }

    # The winner of the first race is ranked first, so that the live standings
    # and the posted results below disagree about who came where.
    def enter_live_results(values)
      set = match.h2h_sets.create!(set_number: 1)

      registrations.zip(competitors, values).each_with_index do |(registration, competitor, value), index|
        live_result = create(:live_result, registration: registration, round: round, best: value, average: 0,
                                           global_pos: index + 1, local_pos: index + 1, attempts_count: 0)
        live_attempt = create(:live_attempt, live_result: live_result, value: value, attempt_number: 1)
        set.h2h_attempts.create!(h2h_match_competitor: competitor, live_attempt: live_attempt, set_attempt_number: 1)
      end
    end

    it "renders matches with competitors, sets and attempts" do
      enter_live_results([500, 600])

      get api_v1_competition_head_to_head_path(competition)
      expect(response).to be_successful

      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json[0]["wcif_id"]).to eq round.wcif_id
      expect(json[0]["event_id"]).to eq "333"

      json_match = json[0]["matches"][0]
      expect(json_match["match_number"]).to eq 1
      expect(json_match["competitors"].pluck("user_id")).to match_array users.map(&:id)
      expect(json_match["competitors"].pluck("wca_id")).to match_array users.map(&:wca_id)
      expect(json_match["sets"][0]["attempts"].pluck("value")).to contain_exactly(500, 600)
    end

    it "takes final positions from the live standings before results are posted" do
      enter_live_results([500, 600])

      get api_v1_competition_head_to_head_path(competition)

      competitors_json = response.parsed_body.dig(0, "matches", 0, "competitors")
      expect(competitors_json.to_h { [it["user_id"], it["final_pos"]] })
        .to eq({ users[0].id => 1, users[1].id => 2 })
    end

    it "prefers posted results over the live standings once results exist" do
      enter_live_results([500, 600])
      # Deliberately the reverse of the live standings, so we can tell which won.
      users.reverse.each_with_index do |user, index|
        create(:result, competition: competition, round: round, person: user.person,
                        event_id: "333", round_type_id: round.round_type_id, format_id: "h",
                        best: 500, average: 0, pos: index + 1)
      end

      get api_v1_competition_head_to_head_path(competition)

      competitors_json = response.parsed_body.dig(0, "matches", 0, "competitors")
      expect(competitors_json.to_h { [it["user_id"], it["final_pos"]] })
        .to eq({ users[0].id => 2, users[1].id => 1 })
    end

    it "orders matches and sets by number regardless of insertion order" do
      round.h2h_matches.create!(match_number: 3)
      round.h2h_matches.create!(match_number: 2)
      [3, 1, 2].each { match.h2h_sets.create!(set_number: it) }

      get api_v1_competition_head_to_head_path(competition)

      json_round = response.parsed_body[0]
      expect(json_round["matches"].pluck("match_number")).to eq [1, 2, 3]
      expect(json_round["matches"][0]["sets"].pluck("set_number")).to eq [1, 2, 3]
    end

    it "renders nothing for a competition without head-to-head rounds" do
      plain_competition = create(:competition, :visible, with_rounds: true)

      get api_v1_competition_head_to_head_path(plain_competition)

      expect(response).to be_successful
      expect(response.parsed_body).to be_empty
    end
  end
end
