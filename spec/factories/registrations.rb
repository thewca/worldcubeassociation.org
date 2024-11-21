# frozen_string_literal: true

FactoryBot.define do
  factory :registration do
    association :competition, factory: [:competition, :registration_open]
    association :user, factory: [:user, :wca_id]
    guests { 10 }
    comments { "" }
    created_at { Time.now }
    administrative_notes { "" }
    transient do
      # TODO: Consider refactoring registration event definitions to be less reliant on hardcoded event IDs?
      event_ids { ['333', '333oh'] }
      events { competition.events.where(id: event_ids) }
    end
    competition_events { competition.competition_events.where(event: events) }

    competing_status { Registrations::Helper::STATUS_PENDING }

    trait :skip_validations do
      to_create { |instance| instance.save(validate: false) }
    end

    trait :accepted do
      accepted_at { Time.now }
      competing_status { Registrations::Helper::STATUS_ACCEPTED }
    end

    trait :cancelled do
      deleted_at { Time.now }
      competing_status { Registrations::Helper::STATUS_CANCELLED }
    end

    trait :pending do
      accepted_at { nil }
      competing_status { Registrations::Helper::STATUS_PENDING }
    end

    trait :waiting_list do
      accepted_at { nil }
      competing_status { Registrations::Helper::STATUS_WAITING_LIST }
    end

    trait :newcomer do
      association :user, factory: [:user]
    end

    trait :paid do
      after(:create) do |registration|
        FactoryBot.create :registration_payment, registration: registration, user: registration.user,
                                                 amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination
      end
    end

    trait :unpaid do
      after(:create) do |registration|
        FactoryBot.create :registration_payment, registration: registration, user: registration.user
      end
    end

    trait :paid_pending do
      accepted_at { nil }
      paid
    end

    after(:create) do |registration|
      registration.competition.waiting_list.add(registration.id) if registration.competing_status == Registrations::Helper::STATUS_WAITING_LIST
    end
  end
end
