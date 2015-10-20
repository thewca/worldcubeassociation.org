require 'rails_helper'

describe Api::V0::ApiController do
  describe 'GET #users_search' do
    it 'requires query parameter' do
      get :users_search
      expect(response.status).to eq 400
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["error"]).to eq "No query specified"
    end

    it 'finds Jeremy' do
      user = FactoryGirl.create(:user, name: "Jeremy")
      get :users_search, q: "erem"
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["users"].select { |u| u["name"] == "Jeremy"}[0]).not_to be_nil
    end

    it 'does not find dummy accounts' do
      user = FactoryGirl.create(:user, name: "Jeremy")
      user.update_column(:encrypted_password, "")
      get :users_search, q: "erem"
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["users"].length).to eq 0
    end
  end

  describe 'GET #users_delegates_search' do
    it 'only finds delegates' do
      user = FactoryGirl.create(:user, name: "Jeremy")
      delegate = FactoryGirl.create(:delegate, name: "Jeremy")
      get :users_delegates_search, q: "erem"
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["users"].length).to eq 1
      expect(parsed_body["users"][0]["id"]).to eq delegate.id
    end
  end

  describe 'GET #scramble_program' do
    it 'works' do
      get :scramble_program
      expect(response.status).to eq 200
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["current"]["name"]).to eq "TNoodle-WCA-0.10.0"
    end
  end
end
