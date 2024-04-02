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
      group { FactoryBot.create(:delegate_probations_user_group) }
    end

    trait :translators do
      group { FactoryBot.create(:translators_user_group) }
      metadata { FactoryBot.create(:translator_en_role_metadata) }
    end

    trait :delegate_regions do
      group { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group }
    end

    trait :delegate_regions_senior_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'senior_delegate') }
    end

    trait :delegate_regions_regional_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'regional_delegate') }
    end

    trait :officers do
      group { FactoryBot.create(:officers_user_group) }
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

    trait :board do
      group_id { UserGroup.board_group.id }
    end

    factory :delegate_role do
      user { FactoryBot.create(:user) }
      group_id { GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group.id }
      start_date { Date.today - 1.year }
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'delegate') }
    end

    factory :probation_role, traits: [:delegate_probation, :active]
    factory :translator_role, traits: [:translators, :active]
    factory :senior_delegate_role, traits: [:delegate_regions, :delegate_regions_senior_delegate, :active]
    factory :regional_delegate_role, traits: [:delegate_regions, :delegate_regions_regional_delegate, :active]

    factory :executive_director_role, traits: [:officers, :officers_executive_director, :active]
    factory :chair_role, traits: [:officers, :officers_chair, :active]
    factory :vice_chair_role, traits: [:officers, :officers_vice_chair, :active]
    factory :secretary_role, traits: [:officers, :officers_secretary, :active]
    factory :treasurer_role, traits: [:officers, :officers_treasurer, :active]
    factory :wac_role_leader, traits: [:councils_leader, :active]
    factory :wac_role_member, traits: [:councils_member, :active]
    factory :board_role, traits: [:board, :active]
  end
end
