# frozen_string_literal: true
require 'rails_helper'

RSpec.describe PersonsController, type: :controller do
  describe "GET #index" do
    it "responds to HTML request successfully" do
      get :index
      expect(response.status).to eq 200
    end

    context "Ajax request" do
      let!(:person1) { FactoryGirl.create(:person, name: "Jennifer Lawrence", countryId: "USA", wca_id: "2016LAWR01") }
      let!(:person2) { FactoryGirl.create(:person, name: "Benedict Cumberbatch", countryId: "United Kingdom", wca_id: "2016CUMB01") }
      let!(:competition) { FactoryGirl.create(:competition) }
      let!(:result) { FactoryGirl.create(:result, pos: 1, roundId: "f", competitionId: competition.id, person: person1) }

      it "responds with correct JSON when region and search are specified" do
        get :index, params: { search: "Jennifer", region: "USA" }, xhr: true
        json = JSON.parse(response.body)
        expect(json['total']).to eq 1
        json_person = json['rows'][0]
        expect(json_person['name']).to include "Jennifer Lawrence"
        expect(json_person['wca_id']).to eq "2016LAWR01"
        expect(json_person['country']).to eq "United States"
        expect(json_person['competitions_count']).to eq 1
        expect(json_person['podiums_count']).to eq 1
      end

      it "selecting continent works" do
        get :index, params: { region: "_Europe" }, xhr: true
        json = JSON.parse(response.body)
        expect(json['total']).to eq 1
        expect(json['rows'].count).to eq 1
      end

      it "searching by WCA ID works" do
        get :index, params: { search: "2016" }, xhr: true
        json = JSON.parse(response.body)
        expect(json['total']).to eq 2
        expect(json['rows'].count).to eq 2
      end

      it "works well when parts of the name are given" do
        get :index, params: { search: "Law Jenn" }, xhr: true
        json = JSON.parse(response.body)
        expect(json['total']).to eq 1
        expect(json['rows'].count).to eq 1
        expect(json['rows'][0]['name']).to include "Jennifer Lawrence"
      end
    end
  end
end
