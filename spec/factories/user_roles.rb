# frozen_string_literal: true

FactoryBot.define do
  factory :user_role do
    user { FactoryBot.create(:user) }

    trait :active do
      start_date { Date.today }
    end

    trait :inactive do
      start_date { Date.today - 1.year }
      end_date { Date.today - 1.day }
    end

    trait :delegate_probation do
      user { FactoryBot.create(:delegate) }
      group { UserGroup.delegate_probation.first }
    end

    trait :translators do
      group { GroupsMetadataTranslators.find_by!(locale: 'ca').user_group }
      metadata { FactoryBot.create(:translator_ca_role_metadata) }
    end

    trait :delegate_regions do
      group { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
      after(:create) do |user_role|
        user_role.metadata.update!(location: 'Zimbabwe')
      end
    end

    trait :delegate_regions_senior_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'senior_delegate') }
    end

    trait :delegate_regions_regional_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'regional_delegate') }
    end

    trait :delegate_regions_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'delegate') }
    end

    trait :delegate_regions_junior_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'junior_delegate') }
    end

    trait :delegate_regions_trainee_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'trainee_delegate') }
    end

    trait :officers do
      group { UserGroup.officers.first }
    end

    trait :officers_executive_director do
      metadata { FactoryBot.create(:executive_director_role_metadata) }
    end

    trait :officers_chair do
      metadata { FactoryBot.create(:chair_role_metadata) }
    end

    trait :officers_vice_chair do
      metadata { FactoryBot.create(:vice_chair_role_metadata) }
    end

    trait :officers_secretary do
      metadata { FactoryBot.create(:secretary_role_metadata) }
    end

    trait :officers_treasurer do
      metadata { FactoryBot.create(:treasurer_role_metadata) }
    end

    trait :councils_leader do
      group { UserGroup.council_group_wac }
      metadata { FactoryBot.create(:wac_role_metadata, status: RolesMetadataCouncils.statuses[:leader]) }
    end

    trait :councils_member do
      group { UserGroup.council_group_wac }
      metadata { FactoryBot.create(:wac_role_metadata, status: RolesMetadataCouncils.statuses[:member]) }
    end

    trait :wst_admin_member do
      group { UserGroup.teams_committees_group_wst_admin }
      metadata { FactoryBot.create(:wst_admin_metadata, status: RolesMetadataTeamsCommittees.statuses[:member]) }
    end

    trait :wct_china_member do
      group { UserGroup.teams_committees_group_wct_china }
      metadata { FactoryBot.create(:wct_china_metadata, status: RolesMetadataTeamsCommittees.statuses[:member]) }
    end

    trait :wrt_member do
      group { UserGroup.teams_committees_group_wrt }
      metadata { FactoryBot.create(:wrt_member_metadata) }
    end

    trait :wrt_leader do
      group { UserGroup.teams_committees_group_wrt }
      metadata { FactoryBot.create(:wrt_leader_metadata) }
    end

    trait :wqac_member do
      group { UserGroup.teams_committees_group_wqac }
      metadata { FactoryBot.create(:wqac_member_metadata) }
    end

    trait :wct_member do
      group { UserGroup.teams_committees_group_wct }
      metadata { FactoryBot.create(:wct_member_metadata) }
    end

    trait :board do
      group_id { UserGroup.board_group.id }
    end

    factory :probation_role, traits: [:delegate_probation, :active]
    factory :translator_role, traits: [:translators, :active]
    factory :trainee_delegate_role, traits: [:delegate_regions, :delegate_regions_trainee_delegate, :active]
    factory :junior_delegate_role, traits: [:delegate_regions, :delegate_regions_junior_delegate, :active]
    factory :delegate_role, traits: [:delegate_regions, :delegate_regions_delegate, :active]
    factory :regional_delegate_role, traits: [:delegate_regions, :delegate_regions_regional_delegate, :active]
    factory :senior_delegate_role, traits: [:delegate_regions, :delegate_regions_senior_delegate, :active]

    factory :executive_director_role, traits: [:officers, :officers_executive_director, :active]
    factory :chair_role, traits: [:officers, :officers_chair, :active]
    factory :vice_chair_role, traits: [:officers, :officers_vice_chair, :active]
    factory :secretary_role, traits: [:officers, :officers_secretary, :active]
    factory :treasurer_role, traits: [:officers, :officers_treasurer, :active]
    factory :wac_role_leader, traits: [:councils_leader, :active]
    factory :wac_role_member, traits: [:councils_member, :active]
    factory :wst_admin_role, traits: [:wst_admin_member, :active]
    factory :wct_china_role, traits: [:wct_china_member, :active]
    factory :wrt_member_role, traits: [:wrt_member, :active]
    factory :wrt_leader_role, traits: [:wrt_leader, :active]
    factory :wqac_member_role, traits: [:wqac_member, :active]
    factory :wct_member_role, traits: [:wct_member, :active]
    factory :board_role, traits: [:board, :active]
  end
end
