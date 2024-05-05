# frozen_string_literal: true

FactoryBot.define do
  factory :regional_organization do
    name { "World Cube Association" }
    country { "United States" }
    website { "https://www.worldcubeassociation.org/" }
    logo { Rack::Test::UploadedFile.new('spec/support/logo.png', 'image/png') }
    email { "contact@worldcubeassociation.org" }
    address { "Street and Number, City, State, Postal code, Country" }
    bylaws { Rack::Test::UploadedFile.new('spec/support/bylaws.pdf', 'application/pdf') }
    directors_and_officers { "Directors and Officers" }
    area_description { "World" }
    past_and_current_activities { "Activities" }
    future_plans { "Plans" }
    extra_information { "" }
    start_date { Date.today }
    end_date { nil }
  end
end
