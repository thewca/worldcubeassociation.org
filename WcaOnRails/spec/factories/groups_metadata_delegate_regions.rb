# frozen_string_literal: true

FactoryBot.define do
  factory :groups_metadata_delegate_regions do
    factory :delegate_region_americas_metadata do
      friendly_id { "am" }
    end

    factory :delegate_region_asia_pacific_metadata do
      friendly_id { "apac" }
    end

    factory :delegate_region_europe_metadata do
      friendly_id { "eu" }
    end

    factory :delegate_region_middle_east_africa_metadata do
      friendly_id { "mea" }
    end

    factory :delegate_region_usa_metadata do
      friendly_id { "us" }
    end
  end
end
