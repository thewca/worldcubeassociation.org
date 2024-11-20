# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::Internal::V1::UsersController do
  describe 'GET #competitor_info' do
    let!(:user1) { FactoryBot.create(:user, email: "user1@example.com", dob: Date.new(2000, 1, 1)) }
    let!(:user2) { FactoryBot.create(:user, email: "user2@example.com", dob: Date.new(2001, 1, 1)) }
    before :each do
      # Stub vault validation
      allow(controller).to receive(:validate_wca_token).and_return(true)
    end
    it 'returns the correct pii' do
      get :competitor_info, params: { ids: [user1.id, user2.id] }

      parsed_body = JSON.parse(response.body, symbolize_names: true)

      expect(parsed_body).to eq([{
                                  id: user1.id,
                                  wca_id: user1.wca_id,
                                  name: user1.name,
                                  gender: user1.gender,
                                  country_iso2: user1.country_iso2,
                                  email: "user1@example.com",
                                  dob: "2000-01-01",
                                  class: "user",
                                }, {
                                  id: user2.id,
                                  wca_id: user2.wca_id,
                                  name: user2.name,
                                  gender: user2.gender,
                                  country_iso2: user2.country_iso2,
                                  email: "user2@example.com",
                                  dob: "2001-01-01",
                                  class: "user",
                                }])
    end
  end
end
