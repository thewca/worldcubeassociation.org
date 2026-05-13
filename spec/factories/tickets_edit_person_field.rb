# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_edit_person_field do
    trait :edit_name do
      field_name { :name }
      new_value { Faker::Name }
    end

    trait :edit_dob do
      field_name { :dob }
      new_value { Faker::Date.between(from: 10.years.ago, to: 5.years.ago) }
    end

    trait :edit_country do
      field_name { :country_iso2 }
      new_value { Country.real.sample.iso2 }
    end

    trait :edit_gender do
      field_name { :gender }
      new_value { :m }
    end

    factory :tickets_edit_name_field, traits: [:edit_name]
    factory :tickets_edit_dob_field, traits: [:edit_dob]
    factory :tickets_edit_country_field, traits: [:edit_country]
    factory :tickets_edit_gender_field, traits: [:edit_gender]
  end
end
