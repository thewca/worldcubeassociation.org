require 'rails_helper'

describe Api::V0::CompetitionsController do
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

  describe 'GET #show' do
    it '404s on invalid competition' do
      get :show, id: "FakeId2014"
      expect(response.status).to eq 404
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["error"]).to eq "Competition with id FakeId2014 not found"
    end

    it '404s on hidden competition' do
      competition.update_column(:showAtAll, false);
      get :show, id: competition.id
      expect(response.status).to eq 404
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["error"]).to eq "Competition with id #{competition.id} not found"
    end

    it 'finds competition' do
      get :show, id: competition.id
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["id"]).to eq "TestComp2014"
      expect(parsed_body["start_date"]).to eq "2014-02-03"
      expect(parsed_body["end_date"]).to eq "2014-02-05"
      expect(parsed_body["website"]).to eq "http://example.com"
    end
  end
end
