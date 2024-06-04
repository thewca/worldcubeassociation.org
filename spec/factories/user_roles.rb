# frozen_string_literal: true

FactoryBot.define do
  factory :user_role do
    user { FactoryBot.create(:user) }

    trait :active do
      start_date { Date.today }
    end

    trait :inactive do
      start_date { Faker::Date.between(from: 10.years.ago, to: 5.years.ago) }
      end_date { Faker::Date.between(from: 5.years.ago, to: Date.today) }
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

    trait :wat_member do
      group { UserGroup.teams_committees_group_wat }
      metadata { FactoryBot.create(:wat_member_metadata) }
    end

    trait :wat_leader do
      group { UserGroup.teams_committees_group_wat }
      metadata { FactoryBot.create(:wat_leader_metadata) }
    end

    trait :wsot_member do
      group { UserGroup.teams_committees_group_wsot }
      metadata { FactoryBot.create(:wsot_member_metadata) }
    end

    trait :wsot_leader do
      group { UserGroup.teams_committees_group_wsot }
      metadata { FactoryBot.create(:wsot_leader_metadata) }
    end

    trait :weat_member do
      group { UserGroup.teams_committees_group_weat }
      metadata { FactoryBot.create(:weat_member_metadata) }
    end

    trait :wcat_member do
      group { UserGroup.teams_committees_group_wcat }
      metadata { FactoryBot.create(:wcat_member_metadata) }
    end

    trait :wdc_member do
      group { UserGroup.teams_committees_group_wdc }
      metadata { FactoryBot.create(:wdc_member_metadata) }
    end

    trait :wdc_leader do
      group { UserGroup.teams_committees_group_wdc }
      metadata { FactoryBot.create(:wdc_leader_metadata) }
    end

    trait :wec_member do
      group { UserGroup.teams_committees_group_wec }
      metadata { FactoryBot.create(:wec_member_metadata) }
    end

    trait :wfc_member do
      group { UserGroup.teams_committees_group_wfc }
      metadata { FactoryBot.create(:wfc_member_metadata) }
    end

    trait :wfc_leader do
      group { UserGroup.teams_committees_group_wfc }
      metadata { FactoryBot.create(:wfc_leader_metadata) }
    end

    trait :wmt_member do
      group { UserGroup.teams_committees_group_wmt }
      metadata { FactoryBot.create(:wmt_member_metadata) }
    end

    trait :wst_member do
      group { UserGroup.teams_committees_group_wst }
      metadata { FactoryBot.create(:wst_member_metadata) }
    end

    trait :wrc_member do
      group { UserGroup.teams_committees_group_wrc }
      metadata { FactoryBot.create(:wrc_member_metadata) }
    end

    trait :wrc_senior_member do
      group { UserGroup.teams_committees_group_wrc }
      metadata { FactoryBot.create(:wrc_senior_member_metadata) }
    end

    trait :wrc_leader do
      group { UserGroup.teams_committees_group_wrc }
      metadata { FactoryBot.create(:wrc_leader_metadata) }
    end

    trait :board do
      group_id { UserGroup.board_group.id }
    end

    trait :banned_competitor do
      group_id { UserGroup.banned_competitors.first.id }
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
    factory :wat_member_role, traits: [:wat_member, :active]
    factory :wat_leader_role, traits: [:wat_leader, :active]
    factory :wsot_member_role, traits: [:wsot_member, :active]
    factory :wsot_leader_role, traits: [:wsot_leader, :active]
    factory :weat_member_role, traits: [:weat_member, :active]
    factory :wcat_member_role, traits: [:wcat_member, :active]
    factory :wdc_member_role, traits: [:wdc_member, :active]
    factory :wdc_leader_role, traits: [:wdc_leader, :active]
    factory :wec_member_role, traits: [:wec_member, :active]
    factory :wfc_member_role, traits: [:wfc_member, :active]
    factory :wfc_leader_role, traits: [:wfc_leader, :active]
    factory :wmt_member_role, traits: [:wmt_member, :active]
    factory :wst_member_role, traits: [:wst_member, :active]
    factory :wrc_member_role, traits: [:wrc_member, :active]
    factory :wrc_senior_member_role, traits: [:wrc_senior_member, :active]
    factory :wrc_leader_role, traits: [:wrc_leader, :active]
    factory :board_role, traits: [:board, :active]
    factory :banned_competitor_role, traits: [:banned_competitor, :active]
  end
end
