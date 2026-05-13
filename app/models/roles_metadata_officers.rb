# frozen_string_literal: true

class RolesMetadataOfficers < ApplicationRecord
  enum :status, {
    executive_director: "executive_director",
    chief_operating_officer: "chief_operating_officer",
    chair: "chair",
    vice_chair: "vice_chair",
    secretary: "secretary",
    treasurer: "treasurer",
  }

  scope :higher_permission, -> { where(status: [:chief_operating_officer]) }
end
