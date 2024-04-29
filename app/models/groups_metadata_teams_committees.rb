# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  has_one :user_group, as: :metadata

  def self.at_least_senior_member?(role)
    [
      RolesMetadataTeamsCommittees.statuses[:senior_member],
      RolesMetadataTeamsCommittees.statuses[:leader],
    ].include?(UserRole.status(role))
  end
end
