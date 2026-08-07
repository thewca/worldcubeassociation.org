# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::UserGroupsController do
  describe 'GET #list' do
    context 'when user is not logged in' do
      it 'returns empty list when requested for list of probation group' do
        get :index, params: {
          groupType: UserGroup.group_types[:delegate_probation],
        }

        expect(response.body).to eq([].to_json)
      end

      it 'returns list of delegate regions' do
        get :index, params: {
          groupType: UserGroup.group_types[:delegate_regions],
        }

        expect(response.body).to eq([
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-east').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-west').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'australia').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-north').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-south').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'india').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'new-zealand').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'north-america').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'south-america').user_group,
        ].to_json(methods: %w[lead_user]))
      end

      it 'returns list of active delegate regions' do
        get :index, params: {
          groupType: UserGroup.group_types[:delegate_regions],
          isActive: true,
        }

        expect(response.body).to eq([
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-east').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-west').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'australia').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-north').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-south').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'india').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'new-zealand').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania').user_group,
        ].to_json(methods: %w[lead_user]))
      end

      it 'returns list of inactive delegate regions' do
        get :index, params: {
          groupType: UserGroup.group_types[:delegate_regions],
          isActive: false,
        }

        expect(response.body).to eq([
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'north-america').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'south-america').user_group,
        ].to_json(methods: %w[lead_user]))
      end

      it 'returns list of delegate regions under europe' do
        get :index, params: {
          groupType: UserGroup.group_types[:delegate_regions],
          parentGroupId: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group.id,
        }

        expect(response.body).to eq([
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-north').user_group,
          GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-south').user_group,
        ].to_json(methods: %w[lead_user]))
      end
    end
  end

  describe 'GET #show' do
    let(:user_group) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
    let(:hidden_user_group) { UserGroup.find_by!(name: 'North America').tap { |g| g.update!(is_hidden: true) }.reload }

    context 'when group is not hidden' do
      it 'returns the user group for guests' do
        get :show, params: { id: user_group.id }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq(user_group.to_json)
      end

      it 'returns the user group for normal users' do
        allow(controller).to receive(:current_user).and_return(create(:user))
        get :show, params: { id: user_group.id }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq(user_group.to_json)
      end
    end

    context 'when group is hidden' do
      it 'returns unauthorized for guests' do
        get :show, params: { id: hidden_user_group.id }
        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns unauthorized for normal users' do
        allow(controller).to receive(:current_user).and_return(create(:user))
        get :show, params: { id: hidden_user_group.id }
        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns the user group for admins' do
        allow(controller).to receive(:current_user).and_return(create(:admin))
        get :show, params: { id: hidden_user_group.id }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq(hidden_user_group.to_json)
      end
    end
  end

  describe 'PATCH #update' do
    let(:user_group) { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
    let(:admin) { create(:admin) }

    before do
      allow(controller).to receive(:current_user).and_return(admin)
    end

    context 'when deactivating the group' do
      it 'ends active lead roles and sends email notifications' do
        role = create(:user_role, :active, :delegate_regions, :delegate_regions_senior_delegate, group: user_group, end_date: nil)

        expect(RoleChangeMailer).to receive(:notify_role_end).with(role, admin).and_call_original

        patch :update, params: { id: user_group.id, user_group: { is_active: false } }

        expect(response).to have_http_status(:success)
        expect(role.reload.active?).to be false
      end

      it 'returns unprocessable entity if there are active non-lead roles' do
        create(:user_role, :active, :delegate_regions, :delegate_regions_delegate, group: user_group, end_date: nil)
      end
    end
  end
end
