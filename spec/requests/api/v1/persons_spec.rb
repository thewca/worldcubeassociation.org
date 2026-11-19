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
      expect(json["teams"].pluck("friendly_id")).to contain_exactly("wst")
      expect(json["delegate_status"]).to eq "delegate"
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

    it "404s for an unknown WCA ID" do
      get api_v1_person_results_path("1000AAAA01")

      expect(response).to have_http_status(:not_found)
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

    it "404s for an unknown WCA ID" do
      get api_v1_person_records_path("1000AAAA01")

      expect(response).to have_http_status(:not_found)
    end
  end
end
