# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RolesMetadataTeamsCommittees, type: :model do
  describe 'at_least_senior_member?' do
    it 'returns false when the role is a WRC member' do
      role = FactoryBot.create(:user_role, :active, :wrc_member)
      expect(role.metadata.at_least_senior_member?).to be false
    end

    it 'returns true when the role is a WRC senior member' do
      role = FactoryBot.create(:user_role, :active, :wrc_senior_member)
      expect(role.metadata.at_least_senior_member?).to be true
    end

    it 'returns true when the role is a WRC leader' do
      role = FactoryBot.create(:user_role, :active, :wrc_leader)
      expect(role.metadata.at_least_senior_member?).to be true
    end
  end
end
