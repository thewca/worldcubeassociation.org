# frozen_string_literal: true

FactoryBot.define do
  factory :inbox_person do
    id 1
    wcaId ""
    name { Faker::Name.name }
    countryId { Country.real.sample.iso2 }
    gender "m"
    dob { Date.new(1966, 4, 4) }
  end
end
