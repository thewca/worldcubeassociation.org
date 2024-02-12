# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::Internal::V1::UsersController do
  describe 'GET #competitor_info' do
    let!(:user1) { FactoryBot.create(email: "user1@example.com", dob: Date.new(2000, 1, 1)) }
    let!(:user2) { FactoryBot.create(email: "user2@example.com", dob: Date.new(2001, 1, 1)) }
    before :each do
      # Stub vault validation
      allow(controller).to receive(:validate_token).and_return(true)
    end
    context 'returns the correct pii' do
      get :competitor_info, params: { ids: [user1.id, user2.id]}

      expect(response.body).to eq([{
                                     :id => user1.id,
                                     :wca_id => user1.wca_id,
                                     :name => user1.name,
                                     :gender => user1.gender,
                                     :country_iso2 => user1.country_iso2,
                                     :email => "user1@example.com",
                                     :dob => "1-1-2000",
                                   },
                                   {
                                     :id => user2.id,
                                     :wca_id => user2.wca_id,
                                     :name => user2.name,
                                     :gender => user2.gender,
                                     :country_iso2 => user2.country_iso2,
                                     :email => "user2@example.com",
                                     :dob => "1-1-2001",
                                   }].to_json)
    end
  end
end
