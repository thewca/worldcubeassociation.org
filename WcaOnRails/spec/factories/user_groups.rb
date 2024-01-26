# frozen_string_literal: true

FactoryBot.define do
  factory :user_group do
    factory :delegate_regions_group do
      factory :delegate_region_americas do
        name { "Americas" }
        group_type { :delegate_regions }
        is_active { true }
        is_hidden { false }
        metadata { FactoryBot.create(:delegate_region_americas_metadata) }
      end

      factory :delegate_region_asia_pacific do
        name { "Asia Pacific" }
        group_type { :delegate_regions }
        is_active { true }
        is_hidden { false }
        metadata { FactoryBot.create(:delegate_region_asia_pacific_metadata) }
      end

      factory :delegate_region_europe do
        name { "Europe" }
        group_type { :delegate_regions }
        is_active { true }
        is_hidden { false }
        metadata { FactoryBot.create(:delegate_region_europe_metadata) }
      end

      factory :delegate_region_middle_east_africa do
        name { "Middle East & Africa" }
        group_type { :delegate_regions }
        is_active { true }
        is_hidden { false }
        metadata { FactoryBot.create(:delegate_region_middle_east_africa_metadata) }
      end

      factory :delegate_region_usa do
        name { "USA" }
        group_type { :delegate_regions }
        parent_group_id { FactoryBot.create(:delegate_region_americas).id }
        is_active { true }
        is_hidden { false }
        metadata { FactoryBot.create(:delegate_region_usa_metadata) }
      end
    end

    factory :africa_region do
      name { "Africa" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :asia_region do
      name { "Asia" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :europe_region do
      name { "Europe" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :north_america_region do
      name { "North America" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :oceania_region do
      name { "Oceania" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :south_america_region do
      name { "South America" }
      group_type { :delegate_regions }
      is_active { true }
      is_hidden { false }
    end

    factory :delegate_probations_user_group do
      name { "Delegate Probation" }
      group_type { :delegate_probation }
      is_active { true }
      is_hidden { true }
    end

    factory :translators_user_group do
      name { "Translators" }
      group_type { :translators }
      is_active { true }
      is_hidden { true }
    end
  end
end
