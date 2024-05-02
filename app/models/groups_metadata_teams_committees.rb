# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  has_one :user_group, as: :metadata

  enum :preferred_contact_mode, {
    no_contact: "no_contact",
    email: "email",
    contact_form: "contact_form",
  }

  def self.at_least_senior_member?(role)
    [
      RolesMetadataTeamsCommittees.statuses[:senior_member],
      RolesMetadataTeamsCommittees.statuses[:leader],
    ].include?(UserRole.status(role))
  end
end
