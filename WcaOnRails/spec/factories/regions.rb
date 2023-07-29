# frozen_string_literal: true

FactoryBot.define do
  factory :region do
    is_active { true }

    factory :dummy_region do
      id { 5 }
      name { "Dummy" }
      friendly_id { "dummy" }
    end

    factory :africa_region do
      name { "Africa" }
      friendly_id { "africa" }
    end

    factory :asia_east_region do
      name { "Asia East" }
      friendly_id { "asia-east" }
    end

    factory :asia_southeast_region do
      name { "Asia Southeast" }
      friendly_id { "asia-southeast" }
    end

    factory :asia_west_south_region do
      name { "Asia West & South" }
      friendly_id { "asia-west-south" }
    end

    factory :central_eurasia_region do
      name { "Central Eurasia" }
      friendly_id { "central-eurasia" }
    end

    factory :europe_region do
      name { "Europe" }
      friendly_id { "europe" }
    end

    factory :latin_america_region do
      name { "Latin America" }
      friendly_id { "latin-america" }
    end

    factory :oceania_region do
      name { "Oceania" }
      friendly_id { "oceania" }
    end

    factory :usa_canada_region do
      name { "USA & Canada" }
      friendly_id { "usa-canada" }
    end
  end
end
