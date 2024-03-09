# frozen_string_literal: true

class RolesMetadataOfficers < ApplicationRecord
  enum :status, {
    executive_director: "executive_director",
    chair: "chair",
    vice_chair: "vice_chair",
    secretary: "secretary",
    treasurer: "treasurer",
  }
end
