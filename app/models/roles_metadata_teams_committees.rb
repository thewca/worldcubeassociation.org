# frozen_string_literal: true

class RolesMetadataTeamsCommittees < ApplicationRecord
  enum :status, {
    leader: "leader",
    senior_member: "senior_member",
    member: "member",
  }

  has_one :user_role, as: :metadata
  has_one :user, through: :user_role

  scope :at_least_senior_member, -> { where(status: [RolesMetadataTeamsCommittees.statuses[:senior_member], RolesMetadataTeamsCommittees.statuses[:leader]]) }

  def at_least_senior_member?
    user_role.status_rank >= UserRole.status_rank(UserGroup.group_types[:teams_committees], RolesMetadataTeamsCommittees.statuses[:senior_member])
  end
end
