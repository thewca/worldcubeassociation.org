# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UserRolesController do
  describe 'GET #list' do
    let!(:user_senior_delegate_role) { FactoryBot.create(:senior_delegate_role) }
    let!(:user_whose_delegate_status_changes) { FactoryBot.create(:junior_delegate_role, group_id: user_senior_delegate_role.group_id).user }
    let!(:delegate) { FactoryBot.create :delegate_role, group_id: user_senior_delegate_role.group_id }
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
    let!(:banned_competitor) { FactoryBot.create(:banned_competitor_role) }

    context 'when user is logged in as senior delegate' do
      before do
        allow(controller).to receive(:current_user) { user_senior_delegate_role.user }
      end

      it 'fetches list of roles of a user' do
        get :index_for_user, params: { user_id: user_whose_delegate_status_changes.id }

        expect(response.body).to eq(user_whose_delegate_status_changes.active_roles.to_json)
      end

      it 'does not fetches list of banned competitos' do
        get :index_for_group_type, params: { group_type: UserGroup.group_types[:banned_competitors] }

        expect(response.body).to eq([banned_competitor].to_json)
      end
    end

    context 'when user is logged in as a normal user' do
      sign_in { FactoryBot.create(:user) }

      it 'fetches list of roles of a user' do
        get :index_for_user, params: { user_id: user_whose_delegate_status_changes.id }

        expect(response.body).to eq(user_whose_delegate_status_changes.active_roles.to_json)
      end

      it 'fetches list of banned competitos' do
        get :index_for_group_type, params: { group_type: UserGroup.group_types[:banned_competitors] }

        expect(response.body).to eq([].to_json)
      end
    end
  end

  describe 'GET #show' do
    let!(:delegate_role) { FactoryBot.create(:delegate_role) }
    let!(:probation_role) { FactoryBot.create(:probation_role) }

    context 'when delegate role is requested' do
      it 'returns the role' do
        get :show, params: { id: delegate_role.id }
        expect(response.body).to eq(delegate_role.to_json)
      end
    end

    context 'when probation role is requested' do
      it 'returns unauthorized error' do
        get :show, params: { id: probation_role.id }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST #create' do
    let!(:user_to_be_banned_with_past_comps) { FactoryBot.create(:user, :with_past_competitions) }
    let!(:user_to_be_banned_with_future_comps) { FactoryBot.create(:user, :with_future_competitions) }
    let!(:user_to_be_banned_with_deleted_registration_in_future_comps) { FactoryBot.create(:user, :with_deleted_registration_in_future_comps) }

    context 'when signed in as a WDC Leader' do
      sign_in { FactoryBot.create(:user, :wdc_leader) }

      it 'can ban a user if the user does not have any upcoming competitions' do
        post :create, params: {
          userId: user_to_be_banned_with_past_comps.id,
          groupType: UserGroup.group_types[:banned_competitors],
        }
        expect(response).to be_successful
      end

      it 'cannot ban a user if the user have any upcoming competitions' do
        post :create, params: {
          userId: user_to_be_banned_with_future_comps.id,
          groupType: UserGroup.group_types[:banned_competitors],
        }
        upcoming_comps_for_user = user_to_be_banned_with_future_comps.competitions_registered_for.not_over.merge(Registration.not_deleted).pluck(:id)
        expect(response).to have_http_status(422)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "The user has upcoming competitions: #{upcoming_comps_for_user.join(', ')}. Before banning the user, make sure their registrations are deleted."
      end

      it 'can ban a user if the user have a deleted registration in an upcoming competitions' do
        post :create, params: {
          userId: user_to_be_banned_with_deleted_registration_in_future_comps.id,
          groupType: UserGroup.group_types[:banned_competitors],
        }
        expect(response).to be_successful
      end

      it 'can add a member to WDC' do
        user = FactoryBot.create(:user)

        expect(user.wdc_team?).to be false
        post :create, params: {
          userId: user.id,
          groupId: UserGroup.teams_committees_group_wdc.id,
          status: RolesMetadataTeamsCommittees.statuses[:member],
        }
        expect(response).to be_successful
        expect(user.reload.wdc_team?).to be true
      end

      it 'can remove a member from WDC' do
        wdc_role = FactoryBot.create(:wdc_member_role, :active)

        expect(wdc_role.user.wdc_team?).to be true
        post :destroy, params: {
          id: wdc_role.id,
        }
        expect(response).to be_successful
        expect(wdc_role.user.reload.wdc_team?).to be false
      end
    end
  end
end
