# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Persons" do
  let!(:person) { create :person }

  describe "GET #index" do
    let!(:other_people) { create_list :person, 3 }

    it "renders properly" do
      get api_v0_persons_path
      expect(response).to be_successful
      json = response.parsed_body
      expect(json.length).to eq 4
    end

    it "renders a person with multiple sub ids once" do
      person.update_using_sub_id!(name: "#{person.name} II")
      get api_v0_persons_path
      expect(response).to be_successful
      json = response.parsed_body
      expect(json.length).to eq 4
    end

    context "when a list of WCA IDs is given" do
      it "renders only people having one of these ids" do
        get api_v0_persons_path, params: { wca_ids: other_people.map(&:wca_id).join(',') }
        expect(response).to be_successful
        json = response.parsed_body
        expect(json.length).to eq 3
        expect(json.map { |element| element["person"]["wca_id"] }).to match_array other_people.map(&:wca_id)
      end
    end

    context "when a query is given" do
      it "renders only people matching the query parameter" do
        get api_v0_persons_path, params: { q: "#{person.wca_id.first(4)} #{person.name[1..]}" }
        expect(response).to be_successful
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json.map { |element| element["person"]["wca_id"] }).to match_array [person.wca_id]
      end
    end
  end

  describe "GET #show" do
    it "renders properly" do
      get api_v0_person_path(person.wca_id)
      expect(response).to be_successful
      json = response.parsed_body
      expect(json["person"]["wca_id"]).to eq person.wca_id
      expect(json["person"]["name"]).to eq person.name
    end

    it "includes personal records in the response" do
      create :ranks_single, person_id: person.wca_id, event_id: "333", best: 450
      create :ranks_average, person_id: person.wca_id, event_id: "333", best: 590
      get api_v0_person_path(person.wca_id)
      expect(response).to be_successful
      json = response.parsed_body
      expect(json["personal_records"]["333"]["single"]["best"]).to eq 450
      expect(json["personal_records"]["333"]["average"]["best"]).to eq 590
    end

    it "includes teams, but not hidden teams" do
      user = create :user, :wca_id, :banned, :wst_member

      get api_v0_person_path(user.wca_id)

      expect(response).to be_successful
      json = response.parsed_body
      expect(json["person"]["teams"].length).to eq 1
      team = json["person"]["teams"].first
      expect(team["friendly_id"]).to eq "wst"
      expect(team["leader"]).to be false
    end
  end

  describe "GET #results" do
    let!(:result) { create :result, person: person }

    it "renders properly" do
      get api_v0_person_results_path(person.wca_id)
      expect(response).to be_successful
      json = response.parsed_body
      expect(json[0]["id"]).to eq result.id
    end
  end

  describe 'GET #personal_records' do
    it 'returns personal records json' do
      expected_response = [
        { "best"=>100, "continentalRanking"=>1, "eventId"=>"333", "nationalRanking"=>1, "type"=>"average", "worldRanking"=>1 },
        { "best"=>100, "continentalRanking"=>1, "eventId"=>"333", "nationalRanking"=>1, "type"=>"single", "worldRanking"=>1 },
      ]

      user = create(:user_with_wca_id, person: create(:person))
      create(:ranks_single, person_id: user.wca_id)
      create(:ranks_average, person_id: user.wca_id)

      get api_v0_personal_records_path(user.wca_id)
      expect(response.parsed_body).to eq(expected_response)
    end
  end
end
