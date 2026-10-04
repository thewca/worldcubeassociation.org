# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserRole do
  describe '#junior_delegate_promotion_date' do
    let(:role) { create(:delegate_role) }
    let(:user) { role.user }

    it 'returns nil when there is no junior role history' do
      create(:trainee_delegate_role, user: user, start_date: '2020-01-01', end_date: '2020-02-01')
      create(:wrc_member_role, user: user)

      expect(role.junior_delegate_promotion_date).to be_nil
    end

    it 'returns the start of a past junior role for a promoted delegate' do
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')

      expect(role.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'returns the start of an active junior role' do
      junior_role = create(:junior_delegate_role, start_date: '2020-02-01')

      expect(junior_role.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'preserves the promotion date when a region transfer starts on the day the previous role ends' do
      other_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
      create(:junior_delegate_role, user: user, group: other_region, start_date: '2021-01-01', end_date: '2022-01-01')
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')

      expect(role.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end

    it 'uses the newest junior role when there is a gap between roles' do
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')
      create(:junior_delegate_role, user: user, start_date: '2021-01-02', end_date: '2022-01-01')

      expect(role.junior_delegate_promotion_date).to eq(Date.new(2021, 1, 2))
    end

    it 'follows multiple consecutive transfers but stops at an earlier gap' do
      create(:junior_delegate_role, user: user, start_date: '2018-01-01', end_date: '2019-01-01')
      create(:junior_delegate_role, user: user, start_date: '2022-01-01', end_date: '2023-01-01')
      create(:junior_delegate_role, user: user, start_date: '2020-02-01', end_date: '2021-01-01')
      create(:junior_delegate_role, user: user, start_date: '2021-01-01', end_date: '2022-01-01')

      expect(role.junior_delegate_promotion_date).to eq(Date.new(2020, 2, 1))
    end
  end

  describe 'can_user_read?' do
    context 'when the role is active banned competitor' do
      let(:active_banned_competitor_role) { create(:banned_competitor_role, :active) }

      it 'returns true when the user is delegate' do
        user = create(:delegate)
        expect(active_banned_competitor_role.can_user_read?(user)).to be true
      end

      it 'returns true when the user is WIC member' do
        user = create(:user, :wic_member)
        expect(active_banned_competitor_role.can_user_read?(user)).to be true
      end

      it 'returns false if no user is passed as argument' do
        expect(active_banned_competitor_role.can_user_read?(nil)).to be false
      end
    end

    context 'when the role is past banned competitor' do
      let(:past_banned_competitor_role) { create(:banned_competitor_role, :inactive) }

      it 'returns false when the user is delegate' do
        user = create(:delegate)
        expect(past_banned_competitor_role.can_user_read?(user)).to be false
      end

      it 'returns true when the user is WIC member' do
        user = create(:user, :wic_member)
        expect(past_banned_competitor_role.can_user_read?(user)).to be true
      end

      it 'returns false if no user is passed as argument' do
        expect(past_banned_competitor_role.can_user_read?(nil)).to be false
      end
    end

    context 'when the role is a delegate role' do
      let(:delegate_role) { create(:delegate_role) }

      it 'returns true for a normal user' do
        user = create(:user)
        expect(delegate_role.can_user_read?(user)).to be true
      end

      it 'returns true if no user is passed as argument' do
        expect(delegate_role.can_user_read?(nil)).to be true
      end
    end

    context 'when the role is a probation role' do
      let(:delegate_probation_role) { create(:probation_role) }

      it 'returns true for a board member' do
        user = create(:user, :board_member)
        expect(delegate_probation_role.can_user_read?(user)).to be true
      end

      it 'returns false for a delegate' do
        user = create(:delegate)
        expect(delegate_probation_role.can_user_read?(user)).to be false
      end

      it 'returns false if no user is passed as argument' do
        expect(delegate_probation_role.can_user_read?(nil)).to be false
      end
    end
  end
end
