# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Api::V0::CompetitionsController do
  describe 'GET #show' do
    let(:competition) {
      FactoryGirl.create(
        :competition,
        :with_delegate,
        id: "TestComp2014",
        start_date: "2014-02-03",
        end_date: "2014-02-05",
        external_website: "http://example.com",
        showAtAll: true,
      )
    }

    it '404s on invalid competition' do
      get :show, params: { id: "FakeId2014" }
      expect(response.status).to eq 404
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["error"]).to eq "Competition with id FakeId2014 not found"
    end

    it '404s on hidden competition' do
      competition.update_column(:showAtAll, false)
      get :show, params: { id: competition.id }
      expect(response.status).to eq 404
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["error"]).to eq "Competition with id #{competition.id} not found"
    end

    it 'finds competition' do
      get :show, params: { id: competition.id }
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["id"]).to eq "TestComp2014"
      expect(parsed_body["start_date"]).to eq "2014-02-03"
      expect(parsed_body["end_date"]).to eq "2014-02-05"
      expect(parsed_body["website"]).to eq "http://example.com"
    end
  end

  describe 'GET #index' do
    it 'sorts newest to oldest' do
      yesteryear_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: 1.year.ago)
      yesterday_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: 1.day.ago)
      today_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: 0.days.ago)
      tomorrow_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: 1.day.from_now)

      get :index
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json.map { |c| c["id"] }).to eq [tomorrow_comp, today_comp, yesterday_comp, yesteryear_comp].map(&:id)
    end

    it 'can query by country_iso2' do
      vietnam_comp = FactoryGirl.create(:competition, :confirmed, :visible, countryId: "Vietnam")
      usa_comp = FactoryGirl.create(:competition, :confirmed, :visible, countryId: "USA")

      get :index, params: { country_iso2: "US" }
      json = JSON.parse(response.body)
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq usa_comp.id

      get :index, params: { country_iso2: "VN" }
      json = JSON.parse(response.body)
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq vietnam_comp.id
    end

    it 'can do a plaintext query' do
      terrible_comp = FactoryGirl.create(:competition, :confirmed, :visible, name: "A terrible competition 2016", countryId: "USA")
      awesome_comp = FactoryGirl.create(:competition, :confirmed, :visible, name: "An awesome competition 2016", countryId: "France")

      get :index, params: { q: "AWES" }
      json = JSON.parse(response.body)
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq awesome_comp.id

      # Check that composing a plaintext query and a country query works.
      get :index, params: { q: "competition", country_iso2: "US" }
      json = JSON.parse(response.body)
      expect(json.length).to eq 1
      expect(json[0]["id"]).to eq terrible_comp.id
    end

    it 'validates start' do
      get :index, params: { start: "2015" }
      expect(response.status).to eq 422
      json = JSON.parse(response.body)
      expect(json["errors"]).to eq ["Invalid start: '2015'"]
    end

    it 'validates end' do
      get :index, params: { end: "2014" }
      expect(response.status).to eq 422
      json = JSON.parse(response.body)
      expect(json["errors"]).to eq ["Invalid end: '2014'"]
    end

    it 'validates country_iso2' do
      get :index, params: { country_iso2: "this is not a country" }
      expect(response.status).to eq 422
      json = JSON.parse(response.body)
      expect(json["errors"]).to eq ["Invalid country_iso2: 'this is not a country'"]
    end

    it 'can query by date' do
      last_feb_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: Date.new(2015, 2, 1))
      feb_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: Date.new(2016, 2, 1))
      march_comp = FactoryGirl.create(:competition, :confirmed, :visible, starts: Date.new(2016, 3, 1))

      get :index, params: { start: "2015-02-01" }
      json = JSON.parse(response.body)
      expect(json.map { |c| c["id"] }).to eq [march_comp.id, feb_comp.id, last_feb_comp.id]

      get :index, params: { end: "2016-03-01" }
      json = JSON.parse(response.body)
      expect(json.map { |c| c["id"] }).to eq [march_comp.id, feb_comp.id, last_feb_comp.id]

      get :index, params: { start: "2015-02-01", end: "2016-02-15" }
      json = JSON.parse(response.body)
      expect(json.map { |c| c["id"] }).to eq [feb_comp.id, last_feb_comp.id]

      get :index, params: { start: "2015-02-01", end: "2015-02-01" }
      json = JSON.parse(response.body)
      expect(json.map { |c| c["id"] }).to eq [last_feb_comp.id]
    end

    it 'paginates' do
      30.times do
        FactoryGirl.create :competition, :confirmed, :visible
      end

      get :index
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json.length).to eq 25

      # Parse HTTP Link header mess
      link = response.headers["Link"]
      links = link.split(/, */)
      next_link = links[1]
      url, rel = next_link.split(/; */)
      url = url[1...-1]
      expect(rel).to eq 'rel="next"'

      get :index, params: Rack::Utils.parse_query(URI(url).query)
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json.length).to eq Competition.count - 25
    end
  end

end
