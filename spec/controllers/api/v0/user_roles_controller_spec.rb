# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UserRolesController do
  describe 'GET #list' do
    let!(:user_senior_delegate_role) { FactoryBot.create(:senior_delegate_role) }
    let!(:user_whose_delegate_status_changes) { FactoryBot.create(:candidate_delegate, region_id: user_senior_delegate_role.group.id, location: 'Australia') }
    let!(:delegate) { FactoryBot.create :delegate, region_id: user_senior_delegate_role.group.id }
    let!(:person) { FactoryBot.create :person, dob: '1990-01-02' }
    let!(:user_who_claims_wca_id) do
      FactoryBot.create(
        :user,
        unconfirmed_wca_id: person.wca_id,
        delegate_id_to_handle_wca_id_claim: user_whose_delegate_status_changes.id,
        claiming_wca_id: true,
        dob_verification: "1990-01-2",
      )
    end

    context 'when user is logged in and changing role data' do
      before do
        allow(controller).to receive(:current_user) { user_senior_delegate_role.user }
      end

      it 'fetches list of roles of a user' do
        get :index_for_user, params: { user_id: user_whose_delegate_status_changes.id }

        expect(response.body).to eq([{
          id: 'delegate-' + user_whose_delegate_status_changes.id.to_s,
          end_date: nil,
          is_active: true,
          group: user_senior_delegate_role.group,
          user: user_whose_delegate_status_changes,
          is_lead: false,
          metadata: {
            status: "candidate_delegate",
            location: "Australia",
          },
          class: 'userrole',
        }].to_json)
      end

      it 'fetches role data' do
        get :show, params: { id: UserRole::DELEGATE_ROLE_ID, userId: user_whose_delegate_status_changes.id, isActiveRole: "true" }
        parsed_body = JSON.parse(response.body)

        expect(parsed_body["roleData"]["delegateStatus"]).to eq "candidate_delegate"
        expect(parsed_body["roleData"]["regionId"]).to eq user_senior_delegate_role.group.id
      end

      it 'update delegate status' do
        expect(DelegateStatusChangeMailer).to receive(:notify_board_and_assistants_of_delegate_status_change).with(
          user_whose_delegate_status_changes,
          user_senior_delegate_role.user,
          user_senior_delegate_role.user,
          "candidate_delegate",
          "delegate",
        ).and_call_original
        expect do
          patch :update, params: { id: UserRole::DELEGATE_ROLE_ID, userId: user_whose_delegate_status_changes.id, delegateStatus: "delegate", regionId: user_senior_delegate_role.group.id, location: "location" }, as: :json
        end.to change { enqueued_jobs.size }.by(1)

        parsed_body = JSON.parse(response.body)
        user_whose_delegate_status_changes.reload

        expect(parsed_body["success"]).to eq true
        expect(user_whose_delegate_status_changes.delegate_status).to eq "delegate"
        expect(user_whose_delegate_status_changes.region_id).to eq user_senior_delegate_role.group.id
        expect(user_whose_delegate_status_changes.location).to eq "location"
      end

      it 'ends delegate role' do
        delete :destroy, params: { id: UserRole::DELEGATE_ROLE_ID, userId: user_whose_delegate_status_changes.id }
        parsed_body = JSON.parse(response.body)

        expect(parsed_body["success"]).to eq true
        expect(user_whose_delegate_status_changes.reload.delegate_status).to eq nil
        expect(user_whose_delegate_status_changes.reload.region_id).to eq nil
        expect(user_whose_delegate_status_changes.reload.location).to eq ""
        expect(user_who_claims_wca_id.reload.unconfirmed_wca_id).to eq nil
      end
    end
  end
end
