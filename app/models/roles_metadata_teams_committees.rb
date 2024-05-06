# frozen_string_literal: true

class RolesMetadataTeamsCommittees < ApplicationRecord
  enum :status, {
    leader: "leader",
    senior_member: "senior_member",
    member: "member",
  }

  def at_least_senior_member?
    [
      RolesMetadataTeamsCommittees.statuses[:senior_member],
      RolesMetadataTeamsCommittees.statuses[:leader],
    ].include?(status)
  end
end
