# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_banned_competitors do
    ban_reason { 'test banned reason' }
    scope { RolesMetadataBannedCompetitors.scopes[:competing_and_attending_and_forums] }
  end
end
