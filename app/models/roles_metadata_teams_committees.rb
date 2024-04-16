# frozen_string_literal: true

class RolesMetadataTeamsCommittees < ApplicationRecord
  enum :status, {
    leader: "leader",
    senior_member: "senior_member",
    member: "member",
  }
end
