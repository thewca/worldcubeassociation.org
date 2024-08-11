# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_teams_committees do
    trait :member do
      status { RolesMetadataTeamsCommittees.statuses[:member] }
    end

    trait :senior_member do
      status { RolesMetadataTeamsCommittees.statuses[:senior_member] }
    end

    trait :leader do
      status { RolesMetadataTeamsCommittees.statuses[:leader] }
    end

    factory :wst_admin_metadata, traits: [:member]
    factory :wct_china_metadata, traits: [:member]
    factory :wrt_member_metadata, traits: [:member]
    factory :wrt_leader_metadata, traits: [:leader]
    factory :wqac_member_metadata, traits: [:member]
    factory :wct_member_metadata, traits: [:member]
    factory :wat_member_metadata, traits: [:member]
    factory :wat_leader_metadata, traits: [:leader]
    factory :wsot_member_metadata, traits: [:member]
    factory :wsot_leader_metadata, traits: [:leader]
    factory :weat_member_metadata, traits: [:member]
    factory :wcat_member_metadata, traits: [:member]
    factory :wic_member_metadata, traits: [:member]
    factory :wic_leader_metadata, traits: [:leader]
    factory :wec_member_metadata, traits: [:member]
    factory :wfc_member_metadata, traits: [:member]
    factory :wfc_leader_metadata, traits: [:leader]
    factory :wmt_member_metadata, traits: [:member]
    factory :wst_member_metadata, traits: [:member]
    factory :wrc_member_metadata, traits: [:member]
    factory :wrc_senior_member_metadata, traits: [:senior_member]
    factory :wrc_leader_metadata, traits: [:leader]
  end
end
