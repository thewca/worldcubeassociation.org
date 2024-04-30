# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_teams_committees do
    trait :member do
      status { RolesMetadataTeamsCommittees.statuses[:member] }
    end

    trait :leader do
      status { RolesMetadataTeamsCommittees.statuses[:leader] }
    end

    factory :wst_admin_metadata, traits: [:member]
    factory :wct_china_metadata, traits: [:member]
    factory :wrt_member_metadata, traits: [:member]
    factory :wrt_leader_metadata, traits: [:leader]
  end
end
