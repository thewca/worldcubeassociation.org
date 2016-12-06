# frozen_string_literal: true
FactoryGirl.define do
  factory :poll do
    question { Faker::Lorem.paragraph }
    multiple false
    deadline { Date.today + 15 }

    trait :confirmed do
      after(:create) do |poll|
        FactoryGirl.create(:poll_option, poll_id: poll.id)
        FactoryGirl.create(:poll_option, poll_id: poll.id)
        poll.confirmed_at = Time.now
        poll.save!
      end
    end

    trait :multiple do
      multiple true
    end
  end
end

FactoryGirl.define do
  factory :poll_option do
    description { Faker::Lorem.words(4).join }
  end
end
