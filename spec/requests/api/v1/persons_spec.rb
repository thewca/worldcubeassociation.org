# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 Persons" do
  let(:person) { create(:person) }

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

      describe "caching" do
        let!(:round_and_results) { create_h2h_round([target_user, opponent_user]) }
        let(:round) { round_and_results.first }
        let(:results) { round_and_results.last }
        let!(:match) { create_match(round, results, 1, [target_user, opponent_user]) }

        shared_examples "an invalidated ETag" do
          it "serves a fresh response with a new ETag" do
            get path
            etag = response.headers["ETag"]

            get path, headers: { "If-None-Match" => etag }
            expect(response).to have_http_status(:not_modified)

            travel_to(1.minute.from_now) { change_data }

            get path, headers: { "If-None-Match" => etag }
            expect(response).to be_successful
            expect(response.headers["ETag"]).not_to eq etag
          end
        end

        context "when a match changes" do
          def change_data = match.touch

          it_behaves_like "an invalidated ETag"
        end

        context "when a set changes" do
          def change_data = match.h2h_sets.first.touch

          it_behaves_like "an invalidated ETag"
        end

        context "when an attempt changes" do
          def change_data = match.h2h_sets.first.h2h_attempts.first.touch

          it_behaves_like "an invalidated ETag"
        end

        context "when an opponent's result in the round changes" do
          def change_data = results[opponent_user].touch

          it_behaves_like "an invalidated ETag"
        end

        it "does not send a Last-Modified that would ignore the matches" do
          get path

          expect(response.headers["Last-Modified"]).to be_nil
        end
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
