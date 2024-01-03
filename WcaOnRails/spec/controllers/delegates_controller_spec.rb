# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DelegatesController do
  let!(:users) { FactoryBot.create_list(:user_with_wca_id, 2) }

  context 'access probation page' do
    it 'senior delegates can view the probation page' do
      sign_in FactoryBot.create :senior_delegate

      get :probations
      expect(response).to render_template :probations
    end

    it 'WFC leader can view the probation page' do
      sign_in FactoryBot.create :user, :wfc_member, team_leader: true

      get :probations
      expect(response).to render_template :probations
    end

    it 'WFC senior members can view the probation page' do
      sign_in FactoryBot.create :user, :wfc_member, team_senior_member: true

      get :probations
      expect(response).to render_template :probations
    end

    it 'normal user cannot view the probation page' do
      sign_in FactoryBot.create :user

      get :probations
      expect(response).to redirect_to root_url
    end
  end

  context 'modify probation roles' do
    before do
      UserGroup.create!(name: "Delegate Probation", group_type: "delegate_probation", is_active: true, is_hidden: true)
      UserRole.create!(
        user_id: users[1].id,
        group_id: UserGroup.find_by!(name: "Delegate Probation").id,
        start_date: Date.today,
      )
    end

    it 'senior delegates can start the probation role' do
      sign_in FactoryBot.create :senior_delegate
      expect(RoleChangeMailer).to receive(:notify_start_probation).and_call_original

      expect do
        post :start_delegate_probation, params: { userId: users[0].id }, format: :json
      end.to change { enqueued_jobs.size }.by(1)
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'senior delegates can end the probation role' do
      sign_in FactoryBot.create :senior_delegate
      expect(RoleChangeMailer).to receive(:notify_change_probation_end_date).and_call_original

      expect do
        post :end_delegate_probation, params: { probationRoleId: UserRole.find_by_user_id(users[1].id).id }, format: :json
      end.to change { enqueued_jobs.size }.by(1)
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'WFC leader can start the probation role' do
      sign_in FactoryBot.create :user, :wfc_member, team_leader: true

      post :start_delegate_probation, params: { userId: users[0].id }, format: :json
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'WFC leader can end the probation role' do
      sign_in FactoryBot.create :user, :wfc_member, team_leader: true

      post :end_delegate_probation, params: { probationRoleId: UserRole.find_by_user_id(users[1].id).id }, format: :json
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'WFC senior members can start the probation role' do
      sign_in FactoryBot.create :user, :wfc_member, team_senior_member: true

      post :start_delegate_probation, params: { userId: users[0].id }, format: :json
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'WFC senior members end modify the probation role' do
      sign_in FactoryBot.create :user, :wfc_member, team_senior_member: true

      post :end_delegate_probation, params: { probationRoleId: UserRole.find_by_user_id(users[1].id).id }, format: :json
      parsed_body = JSON.parse(response.body)
      expect(parsed_body["success"]).to eq true
    end

    it 'normal user cannot start the probation role' do
      sign_in FactoryBot.create :user

      post :start_delegate_probation, params: { userId: users[0].id }, format: :json
      expect(response.status).to eq 401
    end

    it 'normal user cannot end the probation role' do
      sign_in FactoryBot.create :user

      post :end_delegate_probation, params: { probationRoleId: UserRole.find_by_user_id(users[1].id).id }, format: :json
      expect(response.status).to eq 401
    end
  end
end
