FactoryGirl.define do
  factory :poll do
    question { Faker::Lorem.paragraph }
    multiple false
    deadline { Date.today + 15 }
    confirmed false

    factory :confirmed_poll do
      after(:create) do |poll|
        FactoryGirl.create(:poll_option, poll_id: poll.id)
        FactoryGirl.create(:poll_option, poll_id: poll.id)
        poll.confirmed = true
        poll.save!
      end

      trait :multiple do
        multiple true
      end
    end
  end
end

FactoryGirl.define do
  factory :poll_option do
    description { Faker::Lorem.words(4).join }
  end
end
