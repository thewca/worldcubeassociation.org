# frozen_string_literal: true

FactoryBot.define do
  factory :payment_intent do
    holder { association(:registration) }
    payment_record { association(:stripe_record, :payment_intent) }
    initiated_by { association(:user) }
    wca_status { 'pending' }

    trait :manual do
      payment_record { association(:manual_payment_record) }
      wca_status { 'created' }
    end

    trait :manual_with_ref do
      payment_record { association(:manual_payment_record, :with_reference) }
      wca_status { 'requires_capture' }

      after(:create) do |intent|
        create(:registration_payment, receipt: intent.payment_record, registration: intent.holder, is_completed: false)
      end
    end

    trait :canceled do
      canceled_at { DateTime.now }
      wca_status { 'canceled' }
      payment_record { association(:stripe_record, :payment_intent, stripe_status: 'canceled') }
    end

    trait :confirmed do
      confirmed_at { DateTime.now }
      wca_status { 'succeeded' }
      payment_record { association(:stripe_record, :successful_pi) }
    end

    trait :not_started do
      payment_record { association(:stripe_record, :payment_intent, :not_started) }
      wca_status { 'created' }
    end

    trait :pending do
      payment_record { association(:stripe_record) }
    end
  end
end
