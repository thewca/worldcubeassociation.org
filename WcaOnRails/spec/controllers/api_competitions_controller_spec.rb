require 'rails_helper'

describe Api::V0::CompetitionsController do
  let(:competition) { FactoryGirl.create(:competition,
                                         id: "TestComp2014",
                                         start_date: "2014-02-03",
                                         end_date: "2014-02-05",
                                         website: "http://example.com",
                                        ) }

  describe 'GET #show' do
    it 'works' do
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
