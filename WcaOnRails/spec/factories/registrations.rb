FactoryGirl.define do
  factory :registration do
    transient do
      competition { FactoryGirl.create(:competition, :registration_open) }
      user { FactoryGirl.create(:user, :wca_id) }
      event_ids ["333"]
    end
    competitionId { competition.id }
    user_id { user ? user.id : nil }
    guests 10
    comments ""
    # Using accept_nested_attributes_for
    registration_events_attributes do
      event_ids.map do |event_id|
        { event_id: event_id }
      end
    end

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
