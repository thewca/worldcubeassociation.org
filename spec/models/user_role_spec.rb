# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserRole do
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
