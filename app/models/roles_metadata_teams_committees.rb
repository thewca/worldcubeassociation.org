# frozen_string_literal: true

class RolesMetadataTeamsCommittees < ApplicationRecord
  enum :status, {
    leader: "leader",
    senior_member: "senior_member",
    member: "member",
  }

  has_one :user_role, as: :metadata
  has_one :user, through: :user_role

  def at_least_senior_member?
    [
      statuses[:senior_member],
      statuses[:leader],
    ].include?(status)
  end
end
