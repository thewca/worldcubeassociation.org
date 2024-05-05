# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  has_one :user_group, as: :metadata

  enum :preferred_contact_mode, {
    no_contact: "no_contact",
    email: "email",
    contact_form: "contact_form",
  }
end
