# frozen_string_literal: true
FactoryGirl.define do
  factory :registration do
    association :competition, factory: [:competition, :registration_open]
    association :user, factory: [:user, :wca_id]
    guests 10
    comments ""
    events { competition.events }

    trait :accepted do
      accepted_at Time.now
    end

    trait :pending do
      accepted_at nil
    end

    factory :userless_registration do
      name { Faker::Name.name }
      email { Faker::Internet.email }
      birthday "2015-04-30"
      after :create do |registration|
        registration.update_column(:user_id, nil)
      end
    end
  end
end
