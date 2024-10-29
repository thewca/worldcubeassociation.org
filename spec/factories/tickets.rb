# frozen_string_literal: true

FactoryBot.define do
  factory :ticket do
    trait :edit_person do
      ticket_type { :edit_person }
    end
  end
end
