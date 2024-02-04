# frozen_string_literal: true

FactoryBot.define do
  factory :user_role do
    factory :probation_role do
      user { FactoryBot.create(:delegate) }
      group_id { FactoryBot.create(:delegate_probations_user_group).id }
      start_date { Date.today }
      end_date { Date.today + 1.year }
      after(:create) do |role|
        FactoryBot.create(:senior_delegate_role, group: UserGroup.find(role.user.region_id))
      end
    end

    factory :translator_role do
      user { FactoryBot.create(:user) }
      group_id { FactoryBot.create(:translators_user_group).id }
      start_date { Date.today }
      end_date { Date.today + 1.year }
      metadata { FactoryBot.create(:translator_en_role_metadata) }
    end

    factory :delegate_regions_role do
      factory :senior_delegate_role do
        user { FactoryBot.create(:user) }
        group { FactoryBot.create(:delegate_region_americas) }
        start_date { Date.today }
        metadata { FactoryBot.create(:senior_delegate_role_metadata) }
        after(:create) do |role|
          role.user.update(delegate_status: 'senior_delegate', region_id: role.group.id)
        end
      end
    end

    factory :regional_delegate_role do
      user { FactoryBot.create(:user) }
      group_id { FactoryBot.create(:africa_region).id }
      start_date { Date.today }
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'regional_delegate') }
    end
  end
end
