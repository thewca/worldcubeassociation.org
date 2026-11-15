# frozen_string_literal: true

class RolesMetadataBannedCompetitors < ApplicationRecord
  enum :scope, {
    competing_only: "competing_only",
    competing_and_attending: "competing_and_attending",
    competing_and_attending_and_forums: "competing_and_attending_and_forums",
  }

  has_one :user_role, as: :metadata
  has_one :user, through: :user_role

  def minor_competing_ban?
    competing_only? && user.minor?
  end
end
