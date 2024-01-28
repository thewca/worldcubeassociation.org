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
      group { FactoryBot.create(:delegate_probations_user_group) }
    end

    trait :translators do
      group { FactoryBot.create(:translators_user_group) }
      metadata { FactoryBot.create(:translator_en_role_metadata) }
    end

    trait :delegate_regions do
      group { FactoryBot.create(:delegate_region_americas) }
    end

    trait :delegate_regions_senior_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'senior_delegate') }
      after(:create) do |role|
        role.user.update(delegate_status: 'senior_delegate')
        role.user.update(region_id: role.group.id)
      end
    end

    trait :delegate_regions_regional_delegate do
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'regional_delegate') }
    end

    factory :delegate_role do
      user { FactoryBot.create(:user) }
      group_id { FactoryBot.create(:delegate_region_americas).id }
      start_date { Date.today - 1.year }
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'delegate') }
    end

    factory :probation_role, traits: [:delegate_probation, :active]
    factory :translator_role, traits: [:translators, :active]
    factory :senior_delegate_role, traits: [:delegate_regions, :delegate_regions_senior_delegate, :active]
    factory :regional_delegate_role, traits: [:delegate_regions, :delegate_regions_regional_delegate, :active]
  end
end
