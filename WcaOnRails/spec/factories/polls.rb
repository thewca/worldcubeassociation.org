# frozen_string_literal: true

FactoryBot.define do
  factory :poll do
    question { Faker::Lorem.paragraph }
    multiple { false }
    deadline { Date.today + 15 }

    trait :confirmed do
      after(:create) do |poll|
        FactoryBot.create(:poll_option, poll_id: poll.id)
        FactoryBot.create(:poll_option, poll_id: poll.id)
        poll.confirmed_at = Time.now
        poll.save!
      end
    end

    trait :multiple do
      multiple { true }
    end
  end
end

FactoryBot.define do
  factory :poll_option do
    description { Faker::Lorem.words(number: 4).join }
  end
end
