# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_edit_person_field do
    trait :edit_name do
      field_name { :name }
      old_value { Faker::Name }
      new_value { Faker::Name }
    end

    factory :tickets_edit_name_field, traits: [:edit_name]
  end
end
