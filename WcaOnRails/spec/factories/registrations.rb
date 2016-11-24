# frozen_string_literal: true
FactoryGirl.define do
  factory :registration do
    association :competition, factory: [:competition, :registration_open]
    association :user, factory: [:user, :wca_id]
    guests 10
    comments ""
    transient do
      events { competition.events }
    end
    competition_events { competition.competition_events.where(event: events) }

    trait :accepted do
      accepted_at Time.now
    end

    trait :pending do
      accepted_at nil
    end

    trait :newcomer do
      association :user, factory: [:user]
    end
  end
end
