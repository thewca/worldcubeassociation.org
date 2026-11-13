# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RolesMetadataDelegateRegions do
  describe '#senior_region' do
    it 'returns the name of the top-level region' do
      asia_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
      india_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'india').user_group
      role = create(:delegate_role, group: india_region)

      expect(role.metadata.senior_region).to eq(asia_region.name)
    end
  end

  describe '#junior_delegate_promotion_date' do
    let(:role) { create(:delegate_role) }
    let(:metadata) { role.metadata }
    let(:user) { role.user }

    it 'returns nil when there is no junior role history' do
      create(:trainee_delegate_role, user: user, start_date: '2020-01-01', end_date: '2020-02-01')
      create(:wrc_member_role, user: user)

      expect(metadata.junior_delegate_promotion_date).to be_nil
    end

    it 'returns the start of a past junior role for a promoted delegate' do
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')

      expect(metadata.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'returns the start of an active junior role' do
      junior_role = create(:junior_delegate_role, start_date: '2020-02-01')

      expect(junior_role.metadata.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'preserves the promotion date when a region transfer starts on the day the previous role ends' do
      other_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
      create(:junior_delegate_role, user: user, group: other_region, start_date: '2021-01-01', end_date: '2022-01-01')
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')

      expect(metadata.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'uses the newest junior role when there is a gap between roles' do
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')
      create(:junior_delegate_role, user: user, start_date: '2021-01-02', end_date: '2022-01-01')

      expect(metadata.junior_delegate_promotion_date).to eq(Date.new(2021, 1, 2))
    end

    it 'returns nil when the junior period began with a migrated role' do
      create(:junior_delegate_role, user: user, start_date: RolesMetadataDelegateRegions::MIGRATED_ROLE_START_DATE, end_date: '2021-01-01')
      create(:junior_delegate_role, user: user, start_date: '2021-01-01', end_date: '2022-01-01')

      expect(metadata.junior_delegate_promotion_date).to be_nil
    end

    it 'follows multiple consecutive transfers but stops at an earlier gap' do
      create(:junior_delegate_role, user: user, start_date: '2018-01-01', end_date: '2019-01-01')
      create(:junior_delegate_role, user: user, start_date: '2022-01-01', end_date: '2023-01-01')
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')
      create(:junior_delegate_role, user: user, start_date: '2021-01-01', end_date: '2022-01-01')

      expect(metadata.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end
  end
end
