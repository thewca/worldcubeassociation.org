# frozen_string_literal: true

FactoryBot.define do
  factory :user_group do
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
  end
end
