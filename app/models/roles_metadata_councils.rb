# frozen_string_literal: true

class RolesMetadataCouncils < ApplicationRecord
  enum :status, {
    leader: "leader",
    senior_member: "senior_member",
    member: "member",
  }
end
