# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UserRolesController do
  describe 'GET #list' do
    let!(:africa_region) { FactoryBot.create(:africa_region) }
    let!(:user_who_makes_the_change) { FactoryBot.create(:senior_delegate) }
    let!(:user_senior_delegate) { FactoryBot.create(:senior_delegate) }
    let!(:user_whose_delegate_status_changes) { FactoryBot.create(:candidate_delegate, region_id: africa_region.id, location: 'Australia') }
    let!(:delegate) { FactoryBot.create :delegate, region_id: user_senior_delegate.region_id }
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
        allow(controller).to receive(:current_user) { user_who_makes_the_change }
      end

      it 'fetches list of roles of a user' do
        get :index_for_user, params: { user_id: user_whose_delegate_status_changes.id }

        expect(response.body).to eq([{
          end_date: nil,
          is_active: true,
          group: africa_region,
          user: user_whose_delegate_status_changes,
          metadata: {
            status: "candidate_delegate",
            location: "Australia",
            first_delegated: nil,
            last_delegated: nil,
            total_delegated: 0,
          },
        }].to_json)
      end

      it 'fetches role data' do
        get :show, params: { id: UserRole::DELEGATE_ROLE_ID, userId: user_whose_delegate_status_changes.id, isActiveRole: "true" }
        parsed_body = JSON.parse(response.body)

        expect(parsed_body["roleData"]["delegateStatus"]).to eq "candidate_delegate"
        expect(parsed_body["roleData"]["regionId"]).to eq africa_region.id
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
          patch :update, params: { id: UserRole::DELEGATE_ROLE_ID, userId: user_whose_delegate_status_changes.id, delegateStatus: "delegate", regionId: user_senior_delegate.region_id, location: "location" }
        end.to change { enqueued_jobs.size }.by(1)

        parsed_body = JSON.parse(response.body)
        user_whose_delegate_status_changes.reload

        expect(parsed_body["success"]).to eq true
        expect(user_whose_delegate_status_changes.delegate_status).to eq "delegate"
        expect(user_whose_delegate_status_changes.region_id).to eq user_senior_delegate.region_id
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
