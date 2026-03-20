# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_record do
    transient do
      create_child_charge { false }
      stripe_api_prefix { stripe_record_type[...2] }
    end

    stripe_record_type { 'payment_intent' }
    parameters { 'test_parameters' }
    amount_stripe_denomination { 1000 }
    currency_code { 'USD' }
    stripe_status { 'pending' }
    account_id { 'test_account_id' }

    # The Stripe API has a strong guarantee that their IDs are unique,
    #   so our database has an SQL `UNIQUE` constraint on `(stripe_id, stripe_record_type)`.
    # In order to make sure that tests don't break under this constraint,
    #   we mock some non-cryptographic hashes for testing purposes
    sequence(:stripe_id) do |seq|
      hex_digest = Digest::SHA1.hexdigest("#{stripe_record_type}-#{seq}")

      "#{stripe_api_prefix}_#{hex_digest}"
    end

    trait :not_started do
      stripe_status { 'requires_payment_method' }
    end

    trait :successful_pi do
      stripe_status { 'succeeded' }
      create_child_charge { true }
    end

    trait :charge do
      stripe_record_type { 'charge' }
      stripe_status { 'succeeded' }
    end

    trait :refund do
      stripe_record_type { 'refund' }
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
