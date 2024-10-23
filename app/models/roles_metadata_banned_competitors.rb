# frozen_string_literal: true

class RolesMetadataBannedCompetitors < ApplicationRecord
  enum :scope, {
    competing_only: "competing_only",
    competing_and_attending: "competing_and_attending",
    competing_and_attending_and_forums: "competing_and_attending_and_forums",
  }
end
