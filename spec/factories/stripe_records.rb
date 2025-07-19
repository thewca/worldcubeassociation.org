# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_record do
    transient do
      create_child_charge { false }
    end

    stripe_record_type { 'payment_intent' }
    stripe_id { 'test_stripe_id' }
    parameters { 'test_parameters' }
    amount_stripe_denomination { 1000 }
    currency_code { 'USD' }
    stripe_status { 'pending' }
    account_id { 'test_account_id' }

    trait :not_started do
      stripe_status { 'requires_payment_method' }
    end

    trait :successful_pi do
      stripe_status { 'succeeded' }
      create_child_charge { true }
    end

    trait :charge do
      stripe_record_type { 'charge' }
      stripe_id { 'test_charge_id' }
      stripe_status { 'succeeded' }
    end

    trait :refund do
      stripe_record_type { 'refund' }
      stripe_id { 're_3RiDX8I8ds2wj1dZ0RDaaCQg' }
      stripe_status { 'succeeded' }
    end

    trait :pending_refund do
      refund
      stripe_status { 'pending' }
    end

    after(:create) do |record, evaluator|
      FactoryBot.create(:stripe_record, :charge, parent_record: record) if evaluator.create_child_charge
    end
  end
end
