# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::RolesController do
  describe 'GET #list' do
    let!(:user_who_makes_the_change) { FactoryBot.create(:senior_delegate) }
    let(:user_senior_delegate) { FactoryBot.create(:senior_delegate) }
    let(:user_whose_delegate_status_changes) { FactoryBot.create(:delegate, delegate_status: "candidate_delegate", senior_delegate: user_senior_delegate) }

    context 'when user is logged in and changing role data' do
      before do
        allow(controller).to receive(:current_user) { user_who_makes_the_change }
      end

      it 'fetches list of roles' do
        get :list, params: { userId: user_whose_delegate_status_changes.id }

        expect(response.body).to eq({ activeRoles: [{
          role: "candidate_delegate",
        }] }.to_json)
      end

      it 'fetches role data' do
        get :get, params: { userId: user_whose_delegate_status_changes.id, roleId: "delegate" }
        parsed_body = JSON.parse(response.body)

        expect(parsed_body["roleData"]["delegateStatus"]).to eq "candidate_delegate"
        expect(parsed_body["roleData"]["seniorDelegateId"]).to eq user_senior_delegate.id
      end

      it 'update delegate status' do
        expect(DelegateStatusChangeMailer).to receive(:notify_board_and_assistants_of_delegate_status_change).with(
          user_whose_delegate_status_changes,
          user_who_makes_the_change,
          user_senior_delegate,
          "candidate_delegate",
          "delegate",
        ).and_call_original
        expect do
          patch :patch, params: { userId: user_whose_delegate_status_changes.id, delegateStatus: "delegate", seniorDelegateId: user_senior_delegate.id, location: "location" }
        end.to change { enqueued_jobs.size }.by(1)

        parsed_body = JSON.parse(response.body)
        user_whose_delegate_status_changes.reload

        expect(parsed_body["success"]).to eq true
        expect(user_whose_delegate_status_changes.delegate_status).to eq "delegate"
        expect(user_whose_delegate_status_changes.senior_delegate_id).to eq user_senior_delegate.id
        expect(user_whose_delegate_status_changes.location).to eq "location"
      end

      it 'ends delegate role' do
        delete :delete, params: { userId: user_whose_delegate_status_changes.id }
        parsed_body = JSON.parse(response.body)

        expect(parsed_body["success"]).to eq true
        expect(user_whose_delegate_status_changes.reload.delegate_status).to eq nil
        expect(user_whose_delegate_status_changes.reload.senior_delegate_id).to eq nil
        expect(user_whose_delegate_status_changes.reload.location).to eq ""
      end
    end
  end
end
