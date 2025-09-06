# frozen_string_literal: true

FactoryBot.define do
  factory :manual_payment_record do
    payment_reference { nil }
    manual_status { 'created' }
    amount_iso_denomination { 1000 }
    currency_code { 'USD' }

    trait :with_reference do
      payment_reference { 'test_reference' }
      manual_status { 'user_submitted' }
    end

    trait :organizer_approved do
      payment_reference { 'test_reference' }
      manual_status { 'organizer_approved' }
    end
  end
end
