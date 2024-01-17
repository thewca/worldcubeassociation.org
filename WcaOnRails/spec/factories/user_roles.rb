# frozen_string_literal: true

FactoryBot.define do
  factory :user_role do
    factory :probation_role do
      user { FactoryBot.create(:delegate) }
      group_id { FactoryBot.create(:delegate_probations_user_group).id }
      start_date { Date.today }
      end_date { Date.today + 1.year }
    end

    factory :translator_role do
      user { FactoryBot.create(:user) }
      group_id { FactoryBot.create(:translators_user_group).id }
      start_date { Date.today }
      end_date { Date.today + 1.year }
      metadata { FactoryBot.create(:translator_en_role_metadata) }
    end

    factory :regional_delegate_role do
      user { FactoryBot.create(:user) }
      group_id { FactoryBot.create(:africa_region).id }
      start_date { Date.today }
      metadata { FactoryBot.create(:roles_metadata_delegate_regions, status: 'regional_delegate') }
    end
  end

  factory :roles_metadata_delegate_regions do
  end
end
