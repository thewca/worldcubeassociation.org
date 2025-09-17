# frozen_string_literal: true

FactoryBot.define do
  factory :registration_payment do
    transient do
      skip_auto_accept_hook { false }
      competition { registration.competition }
      payment_intent { association(:payment_intent, :confirmed, holder: registration) }
    end

    user_id { registration&.user_id }
    amount_lowest_denomination { competition&.base_entry_fee_lowest_denomination }
    currency_code { competition&.currency_code }
    receipt { payment_intent.payment_record.child_records.first }

    trait :refund do
      amount_lowest_denomination { -competition.base_entry_fee_lowest_denomination }
      registration { refunded_registration_payment&.registration }
      refunded_registration_payment { registration.registration_payments.order(:id).first }
      receipt { association(:stripe_record, :refund, parent_record: refunded_registration_payment.receipt) }
    end

    trait :with_donation do
      amount_lowest_denomination { competition.base_entry_fee_lowest_denomination * 2 }
    end

    trait :skip_create_hook do
      skip_auto_accept_hook { true }
    end

    after(:build) do |_payment, evaluator|
      evaluator.competition.auto_accept_preference = :disabled if evaluator.skip_auto_accept_hook
    end

    after(:create) do |_payment, evaluator|
      evaluator.competition.auto_accept_preference = evaluator.competition.auto_accept_preference_previously_was if evaluator.skip_auto_accept_hook
    end
  end
end
