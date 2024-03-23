# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_record do
    record_type { 'payment_intent' }
    stripe_id { 'test_stripe_id' }
    parameters { 'test_parameters' }
    amount_stripe_denomination { 1000 }
    currency_code { 'USD' }
    stripe_status { 'processing' }
    account_id { 'test_account_id' }

    trait :not_started do
      stripe_status { 'requires_payment_method' }
    end
  end
end
