# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PersonsController do
  describe "GET #index" do
    it "responds to HTML request successfully" do
      get :index
      expect(response).to have_http_status :ok
    end

    # See section titled "InnoDB Full-Text Index Transaction Handling"
    # on https://dev.mysql.com/doc/refman/5.7/en/innodb-fulltext-index.html.
    # "a FULLTEXT search can only see committed data", which means that
    # we cannot run these tests inside of a transaction (as is the default).
    context "Ajax request", :clean_db_with_truncation do
      let!(:person1) { create(:person, name: "Jennifer Lawrence", country_id: "USA", wca_id: "2016LAWR01") }
      let!(:person2) { create(:person, name: "Benedict Cumberbatch", country_id: "United Kingdom", wca_id: "2016CUMB01") }
      let!(:competition) { create(:competition) }
      let!(:result) { create(:result, pos: 1, round_type_id: "f", competition: competition, person: person1) }

      it "responds with correct JSON when region and search are specified" do
        get :index, params: { search: "Jennifer", region: "USA" }, format: :json
        json = response.parsed_body
        expect(json['total']).to eq 1
        json_person = json['rows'][0]
        expect(json_person['name']).to include "Jennifer Lawrence"
        expect(json_person['wca_id']).to eq "2016LAWR01"
        expect(json_person['country']).to eq "US"
        expect(json_person['competitions_count']).to eq 1
        expect(json_person['podiums_count']).to eq 1
      end

      it "selecting continent works" do
        get :index, params: { region: "_Europe" }, format: :json
        json = response.parsed_body
        expect(json['total']).to eq 1
        expect(json['rows'].count).to eq 1
      end

      it "searching by WCA ID works" do
        get :index, params: { search: "2016" }, format: :json
        json = response.parsed_body
        expect(json['total']).to eq 2
        expect(json['rows'].count).to eq 2
      end

      it "works well when parts of the name are given" do
        get :index, params: { search: "Law Jenn" }, format: :json
        json = response.parsed_body
        expect(json['total']).to eq 1
        expect(json['rows'].count).to eq 1
        expect(json['rows'][0]['name']).to include "Jennifer Lawrence"
      end
    end
  end
end
