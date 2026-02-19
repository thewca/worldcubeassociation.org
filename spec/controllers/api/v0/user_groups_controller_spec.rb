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
end
