# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UsersController do
  describe 'GET show_user_*' do
    let!(:user) { FactoryBot.create(:user_with_wca_id, name: "Jeremy") }

    it 'can query by id' do
      get :show_user_by_id, params: { id: user.id }
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq "Jeremy"
      expect(json["user"]["wca_id"]).to eq user.wca_id
    end

    it 'can query by wca id' do
      get :show_user_by_wca_id, params: { wca_id: user.wca_id }
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq "Jeremy"
      expect(json["user"]["wca_id"]).to eq user.wca_id
    end

    it '404s nicely' do
      get :show_user_by_wca_id, params: { wca_id: "foo" }
      expect(response.status).to eq 404
      json = JSON.parse(response.body)
      expect(json["user"]).to be nil
    end

    describe 'upcoming_competitions' do
      let!(:upcoming_comp) { FactoryBot.create(:competition, :confirmed, :visible, starts: 2.weeks.from_now) }
      let!(:registration) { FactoryBot.create(:registration, :accepted, user: user, competition: upcoming_comp) }

      it 'does not render upcoming competitions by default' do
        get :show_user_by_id, params: { id: user.id }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json.keys).not_to include "upcoming_competitions"
      end

      it 'renders upcoming competitions when upcoming_competitions param is set' do
        get :show_user_by_id, params: { id: user.id, upcoming_competitions: true }
        expect(response.status).to eq 200
        json = JSON.parse(response.body)
        expect(json["upcoming_competitions"].size).to eq 1
      end
    end
  end

  describe 'GET #me' do
    let!(:normal_user) { FactoryBot.create(:user_with_wca_id, name: "Jeremy") }

    it 'correctly returns user' do
      sign_in normal_user
      get :show_me
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]).to eq normal_user.as_json
    end
    let!(:id_less_user) { FactoryBot.create(:user, email: "example@email.com") }

    it 'correctly returns user without wca_id' do
      sign_in id_less_user
      get :show_me
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]).to eq id_less_user.as_json
    end

    let(:competed_person) { FactoryBot.create(:person_who_has_competed_once, name: "Jeremy", wca_id: "2005FLEI01") }
    let!(:competed_user) { FactoryBot.create(:user, person: competed_person, email: "example1@email.com") }

    it 'correctly returns user with their prs' do
      sign_in competed_user
      get :show_me
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["user"]).to eq current_user.as_json
      expect(json.key?("rankings")).to eq true
    end
  end

  describe 'GET #permissions' do

    let!(:normal_user) { FactoryBot.create(:user_with_wca_id, name: "Jeremy") }
    let!(:senior_delegate) { FactoryBot.create :senior_delegate }

    it 'correctly returns user a normal users permission' do
      sign_in normal_user
      get :permissions
      expect(response.status).to eq 200
      expect(response.body).to eq normal_user.permissions.to_json
    end
    let!(:banned_user) { FactoryBot.create(:user, :banned) }

    it 'correctly returns that a banned user cant compete' do
      sign_in banned_user
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_attend_competitions"]["scope"]).to eq []
    end

    it 'correctly returns a banned users end_date' do
      banned_user.teams.select(team: Team.banned).first.update_column("end_date", "2012-04-21")
      sign_in banned_user
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_attend_competitions"]["scope"]["until"]).to eq "2012-04-21"
    end

    it 'correctly returns wrt to be able to create competitions' do
      sign_in FactoryBot.create :user, :wrt_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_organize_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns delegate to be able to create competitions' do
      sign_in FactoryBot.create :user, :delegate, senior_delegate: senior_delegate
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_organize_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns wst to be able to create competitions' do
      sign_in FactoryBot.create :user, :wst_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_organize_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns board to be able to create competitions' do
      sign_in FactoryBot.create :user, :board_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_organize_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns board to be able to admin competitions' do
      sign_in FactoryBot.create :user, :board_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_administer_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns wrt to be able to admin competitions' do
      sign_in FactoryBot.create :user, :wrt_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_administer_competitions"]["scope"]).to eq "*"
    end

    it 'correctly returns wst to be able to admin competitions' do
      sign_in FactoryBot.create :user, :wst_member
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_administer_competitions"]["scope"]).to eq "*"
    end

    let!(:delegate_user) { FactoryBot.create :delegate, senior_delegate: senior_delegate }
    let!(:organizer_user) { FactoryBot.create :user }
    let!(:competition) {
      FactoryBot.create(:competition, :confirmed, delegates: [delegate_user], organizers: [organizer_user])
    }

    it 'correctly returns delegates to be able to admin competitions they delegated' do
      sign_in delegate_user
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_administer_competitions"]["scope"]).to eq [competition.id]
    end

    it 'correctly returns organizer to be able to admin competitions they organize' do
      sign_in organizer_user
      get :permissions
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json["can_administer_competitions"]["scope"]).to eq [competition.id]
    end
  end
end
