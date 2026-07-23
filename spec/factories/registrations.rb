# frozen_string_literal: true

FactoryBot.define do
  factory :registration do
    competition factory: %i[competition registration_open]
    user factory: %i[user wca_id]
    guests { 10 }
    comments { "" }
    created_at { Time.now }
    registered_at { Time.now }
    administrative_notes { "" }

    transient do
      # TODO: Consider refactoring registration event definitions to be less reliant on hardcoded event IDs?
      event_ids { %w[333 333oh] }
      events { competition.events.where(id: event_ids) }
    end

    competition_events { competition.competition_events.where(event: events) }

    competing_status { Registrations::Helper::STATUS_PENDING }

    trait :skip_validations do
      to_create { |instance| instance.save(validate: false) }
    end

    trait :non_competing do
      accepted # Must be accepted so that it shows up in WCIF
      is_competing { false }
    end

    trait :accepted do
      competing_status { Registrations::Helper::STATUS_ACCEPTED }
    end

    trait :cancelled do
      competing_status { Registrations::Helper::STATUS_CANCELLED }
    end

    trait :pending do
      competing_status { Registrations::Helper::STATUS_PENDING }
    end

    trait :waiting_list do
      competing_status { Registrations::Helper::STATUS_WAITING_LIST }
    end

    trait :newcomer do
      user
    end

    trait :newcomer_month_eligible do
      user factory: %i[user current_year_wca_id]
    end

    trait :paid do
      after(:create) do |registration|
        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination,
        )
      end
    end

    trait :overpaid do
      after(:create) do |registration|
        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination * 2,
        )
      end
    end

    trait :partially_paid do
      after(:create) do |registration|
        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: (registration.competition.base_entry_fee_lowest_denomination / 2.0).round,
        )
      end
    end

    trait :refunded do
      after(:create) do |registration|
        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination.round,
        )

        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: -registration.competition.base_entry_fee_lowest_denomination,
        )
      end
    end

    trait :uncaptured do
      after(:create) do |registration|
        FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination.round,
          is_completed: false,
        )
      end
    end

    trait :paid_no_hooks do
      after(:create) do |registration|
        payment = FactoryBot.create(
          :registration_payment,
          registration: registration,
          user: registration.user,
          is_completed: false, # Set false so that the successful apyment hooks don't trigger
          amount_lowest_denomination: registration.competition.base_entry_fee_lowest_denomination,
        )
        payment.update_column(:is_completed, true) # Directly update is_completed column to skip hooks
      end
    end

    trait :paid_pending do
      competing_status { Registrations::Helper::STATUS_PENDING }
      paid
    end

    after(:create) do |registration|
      registration.waiting_list.add(registration) if registration.competing_status == Registrations::Helper::STATUS_WAITING_LIST
    end
  end
end
