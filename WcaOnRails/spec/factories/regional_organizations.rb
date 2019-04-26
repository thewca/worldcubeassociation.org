# frozen_string_literal: true

FactoryBot.define do
  factory :regional_organization do
    name { "World Cube Association" }
    country { "United States" }
    website { "https://www.worldcubeassociation.org/" }
    start_date { Date.today }
    end_date { nil }
  end
end
