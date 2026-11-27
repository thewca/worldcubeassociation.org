# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 Persons" do
  let(:person) { create(:person) }

  describe "GET #show" do
    let!(:result) { create(:result, person: person, event_id: "333oh") }

    it "is reachable without logging in" do
      get api_v1_person_path(person.wca_id)

      expect(response).to be_successful
    end

    it "serializes the person's public profile" do
      get api_v1_person_path(person.wca_id)

      json = response.parsed_body
      expect(json).to include("wca_id" => person.wca_id, "name" => person.name, "competition_count" => 1)
      expect(json["completed_solves_count"]).to eq result.result_attempts.count
      expect(json).not_to include("dob")
    end

    it "falls back to the default avatar and no roles for a person without a user" do
      get api_v1_person_path(person.wca_id)

      json = response.parsed_body
      expect(json["avatar"]["is_default"]).to be true
      expect(json["teams"]).to eq []
      expect(json["delegate_status"]).to be_nil
    end

    it "serializes the avatar and roles of the person's user" do
      user = create(:delegate, :wst_member, :with_avatar)

      get api_v1_person_path(user.wca_id)

      json = response.parsed_body
      expect(json["avatar"]["is_default"]).to be false
      expect(json["teams"]).to contain_exactly({ "friendly_id" => "wst", "status" => "member" })
      expect(json["delegate_status"]).to eq "delegate"
    end

    it "serializes the id of the person's user" do
      user = create(:user_with_wca_id)

      get api_v1_person_path(user.wca_id)

      expect(response.parsed_body["user_id"]).to eq user.id
    end

    it "serializes a null user id for a person without a user" do
      get api_v1_person_path(person.wca_id)

      expect(response.parsed_body).to include("user_id" => nil)
    end

    it "serializes a rank per event the person has a single for" do
      create(:ranks_single, person_id: person.wca_id, event_id: "333")

      get api_v1_person_path(person.wca_id)

      ranks = response.parsed_body["ranks_by_event"]
      expect(ranks.keys).to contain_exactly("333")
      expect(ranks["333"].keys).to contain_exactly("single")
      expect(ranks["333"]["single"].keys).to contain_exactly("best", "world_rank", "continent_rank", "country_rank")
    end

    it "serializes every event the person has a result in, even without a rank" do
      create(:result, person: person, event_id: "222", format_id: "a")

      get api_v1_person_path(person.wca_id)

      expect(response.parsed_body["event_ids_with_results"]).to eq %w[222 333oh]
    end

    it "serializes championship podiums as v1 results" do
      world_championship = create(:competition, :world_championship)
      podium_result = create(:result, person: person, competition: world_championship, pos: 2)

      get api_v1_person_path(person.wca_id)

      podiums = response.parsed_body["championship_podium_results"]
      expect(podiums["world"].pluck("id")).to contain_exactly(podium_result.id)
      expect(podiums["world"].first).to include("pos" => 2, "attempts" => podium_result.attempts)
      expect(podiums["national"]).to be_empty
    end

    it "serializes the names the person competed under before" do
      renamed_person = create(:person_with_multiple_sub_ids)

      get api_v1_person_path(renamed_person.wca_id)

      expect(response.parsed_body["previous_persons"]).to eq [{ "name" => "old name", "country_iso2" => renamed_person.country_iso2 }]
    end

    it "serializes the previous names most recent first" do
      renamed_person = create(:person, name: "First Name")
      renamed_person.update_using_sub_id!(name: "Second Name")
      renamed_person.update_using_sub_id!(name: "Third Name")

      get api_v1_person_path(renamed_person.wca_id)

      expect(response.parsed_body["previous_persons"].pluck("name")).to eq ["Second Name", "First Name"]
    end

    it "404s for an unknown WCA ID" do
      get api_v1_person_path("1000AAAA01")

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET #results" do
    let!(:result) { create(:result, person: person) }

    it "is reachable without logging in" do
      get api_v1_person_results_path(person.wca_id)

      expect(response).to be_successful
    end

    it "serializes the competition alongside the result" do
      get api_v1_person_results_path(person.wca_id)

      json = response.parsed_body
      expect(json.length).to eq 1
      expect(json.first).to include(
        "id" => result.id,
        "wca_id" => person.wca_id,
        "name" => person.name,
        "country_iso2" => result.country_iso2,
        "competition_id" => result.competition_id,
        "competition_short_name" => result.competition.short_name,
        "competition_start_date" => result.competition.start_date.to_s,
      )
    end

    it "does not serialize the derivable attempt indices" do
      get api_v1_person_results_path(person.wca_id)

      expect(response.parsed_body.first.keys).not_to include("best_index", "worst_index")
    end

    it "serializes the dual round placement" do
      linked_round = create(:linked_round)
      result.round.update!(linked_round: linked_round)

      get api_v1_person_results_path(person.wca_id)

      expect(response.parsed_body.first).to include(
        "global_pos" => result.global_pos,
        "ranking_mode" => "linked_round",
      )
    end

    it "filters by event when event_id is given" do
      other_event_result = create(:result, person: person, event_id: "222", format_id: "a")

      get api_v1_person_results_path(person.wca_id), params: { event_id: "222" }

      json = response.parsed_body
      expect(json.pluck("id")).to contain_exactly(other_event_result.id)
    end

    it "paginates by competition, newest first, keeping all of a competition's results on one page" do
      newer_competition = create(:competition, starts: result.competition.start_date + 1.week)
      newer_results = [
        create(:result, person: person, competition: newer_competition),
        create(:result, person: person, competition: newer_competition, event_id: "222", format_id: "a"),
      ]

      get api_v1_person_results_path(person.wca_id), params: { per_page: 1, page: 1 }

      expect(response.parsed_body.pluck("id")).to match_array(newer_results.map(&:id))
      expect(response.headers["Total"]).to eq "2"

      get api_v1_person_results_path(person.wca_id), params: { per_page: 1, page: 2 }

      expect(response.parsed_body.pluck("id")).to contain_exactly(result.id)
    end

    it "judges the newest page against results on older pages" do
      older_competition = create(:competition, starts: result.competition.start_date - 1.week)
      create(:result, person: person, competition: older_competition, best: result.best - 100, average: result.average + 100)

      get api_v1_person_results_path(person.wca_id), params: { per_page: 1, page: 1 }

      expect(response.parsed_body.first).to include(
        "id" => result.id,
        "is_personal_best_single" => false,
        "is_personal_best_average" => true,
      )
    end

    it "404s for an unknown WCA ID" do
      get api_v1_person_results_path("1000AAAA01")

      expect(response).to have_http_status(:not_found)
    end

    describe "head-to-head matches" do
      let(:target_user) { create(:user_with_wca_id) }
      let(:opponent_user) { create(:user_with_wca_id) }
      let(:third_user) { create(:user_with_wca_id) }
      let(:path) { api_v1_person_results_path(target_user.wca_id) }

      # Posts a result for each user, in the given order, in a fresh head-to-head round.
      def create_h2h_round(users)
        competition = create(:competition, :visible, with_rounds: true, h2h_finals_event_ids: ['333'])
        round = competition.competition_events.find_by(event_id: "333").rounds.first
        results = users.each_with_index.to_h do |user, index|
          result = create(:result, competition: competition, round: round, person: user.person,
                                   event_id: "333", round_type_id: round.round_type_id, format_id: "h",
                                   best: 500 + index, average: 0, pos: index + 1)
          [user, result]
        end

        [round, results]
      end

      def create_match(round, results, number, users)
        match = round.h2h_matches.create!(match_number: number)
        set = match.h2h_sets.create!(set_number: 1)
        users.each do |user|
          competitor = match.h2h_match_competitors.create!(user: user)
          set.h2h_attempts.create!(h2h_match_competitor: competitor, set_attempt_number: 1,
                                   result_attempt: results[user].result_attempts.first)
        end
        match
      end

      def count_queries(&)
        count = 0
        counter = lambda do |*, payload|
          count += 1 unless payload[:cached] || %w[SCHEMA TRANSACTION].include?(payload[:name])
        end
        ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &)
        count
      end

      it "renders no matches for a result that is not from a head-to-head round" do
        get api_v1_person_results_path(person.wca_id)

        expect(response.parsed_body.first["participated_matches"]).to eq []
      end

      it "renders only the matches the person competed in, with both competitors, sets and attempts" do
        round, results = create_h2h_round([target_user, opponent_user, third_user])
        # Created out of order to check the ordering by match number.
        create_match(round, results, 2, [target_user, third_user])
        create_match(round, results, 1, [target_user, opponent_user])
        create_match(round, results, 3, [opponent_user, third_user])

        get path

        matches = response.parsed_body.first["participated_matches"]
        expect(matches.pluck("match_number")).to eq [1, 2]
        expect(matches.first["competitors"].pluck("user_id")).to contain_exactly(target_user.id, opponent_user.id)
        expect(matches.first["competitors"].pluck("wca_id")).to contain_exactly(target_user.wca_id, opponent_user.wca_id)
        expect(matches.first["sets"].first["attempts"].pluck("value")).to contain_exactly(500, 501)
      end

      it "takes the final positions of everyone in the match from the round standings" do
        round, results = create_h2h_round([target_user, opponent_user])
        create_match(round, results, 1, [target_user, opponent_user])

        get path

        competitors = response.parsed_body.first.dig("participated_matches", 0, "competitors")
        expect(competitors.to_h { [it["user_id"], it["final_pos"]] })
          .to eq({ target_user.id => 1, opponent_user.id => 2 })
      end

      it "attaches the matches to the result of the round they were competed in" do
        first_round, first_results = create_h2h_round([target_user, opponent_user])
        second_round, second_results = create_h2h_round([target_user, third_user])
        create_match(first_round, first_results, 1, [target_user, opponent_user])
        create_match(second_round, second_results, 1, [target_user, third_user])

        get path

        matches_by_result_id = response.parsed_body.to_h { [it["id"], it["participated_matches"]] }
        expect(matches_by_result_id.fetch(first_results[target_user].id).first["competitors"].pluck("user_id"))
          .to contain_exactly(target_user.id, opponent_user.id)
        expect(matches_by_result_id.fetch(second_results[target_user].id).first["competitors"].pluck("user_id"))
          .to contain_exactly(target_user.id, third_user.id)
      end

      it "renders no matches for a person without a user account" do
        round, results = create_h2h_round([target_user, opponent_user])
        create_match(round, results, 1, [target_user, opponent_user])
        accountless = create(:person)
        create(:result, person: accountless, round: round, competition: round.competition,
                        event_id: "333", round_type_id: round.round_type_id, format_id: "h",
                        best: 500, average: 0, pos: 3)

        get api_v1_person_results_path(accountless.wca_id)

        expect(response).to be_successful
        expect(response.parsed_body.first["participated_matches"]).to eq []
      end

      it "still renders when an opponent's account was unlinked from their results" do
        round, results = create_h2h_round([target_user, opponent_user])
        create_match(round, results, 1, [target_user, opponent_user])
        # This is what `User#anonymize` leaves behind for a competitor without a special account.
        opponent_user.update!(wca_id: nil)

        get path

        expect(response).to be_successful
        competitors = response.parsed_body.first.dig("participated_matches", 0, "competitors")
        expect(competitors.to_h { [it["user_id"], it["final_pos"]] })
          .to eq({ target_user.id => 1, opponent_user.id => nil })
      end

      it "does not run more queries when the person has more head-to-head results" do
        # The baseline already mixes head-to-head and plain results. Otherwise the results' rounds and the
        # matches' rounds would be the same set, and Rails' query cache would hide one of the two loads.
        [opponent_user, third_user].each do |other|
          round, results = create_h2h_round([target_user, other])
          create_match(round, results, 1, [target_user, other])
        end
        create(:result, person: target_user.person)
        get path # warm up anything that is cached across requests

        baseline = count_queries { get path }

        round, results = create_h2h_round([target_user, opponent_user, third_user])
        create_match(round, results, 1, [target_user, third_user])
        create(:result, person: target_user.person, event_id: "222", format_id: "a")

        expect(count_queries { get path }).to eq baseline
      end
    end
  end

  describe "GET #records" do
    let!(:single_record) { create(:result, person: person, regional_single_record: "NR") }
    let!(:average_record) { create(:result, person: person, regional_average_record: "WR") }

    before { create(:result, person: person) }

    it "is reachable without logging in" do
      get api_v1_person_records_path(person.wca_id)

      expect(response).to be_successful
    end

    it "returns only results that set a single or an average record" do
      get api_v1_person_records_path(person.wca_id)

      json = response.parsed_body
      expect(json.pluck("id")).to contain_exactly(single_record.id, average_record.id)
    end

    it "does not count a blank marker as a record" do
      create(:result, :skip_validation, person: person, regional_single_record: "")

      get api_v1_person_records_path(person.wca_id)

      json = response.parsed_body
      expect(json.pluck("id")).to contain_exactly(single_record.id, average_record.id)
    end

    it "does not serialize head-to-head matches" do
      get api_v1_person_records_path(person.wca_id)

      expect(response.parsed_body.first.keys).not_to include("participated_matches")
    end

    it "404s for an unknown WCA ID" do
      get api_v1_person_records_path("1000AAAA01")

      expect(response).to have_http_status(:not_found)
    end
  end
end
