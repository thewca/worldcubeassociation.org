# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_webhook_event do
    stripe_id { 'test' }
    event_type { 'payment_intent.succeeded' }
    account_id { 'test_account_id' }
    created_at_remote { 2.seconds.ago }
    handled { 0 }
    stripe_record_id { nil }
  end
end
