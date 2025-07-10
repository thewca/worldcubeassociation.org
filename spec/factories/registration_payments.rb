# frozen_string_literal: true

FactoryBot.define do
  factory :registration_payment do
    transient do
      skip_auto_accept_hook { false }
      competition { registration.competition }
      payment_intent { create(:payment_intent, :confirmed, holder: registration) }
    end

    registration do
      refunded_registration_payment.present? ? refunded_registration_payment.registration : nil
    end
    user_id { registration&.user_id }
    amount_lowest_denomination { competition&.base_entry_fee_lowest_denomination }
    currency_code { competition&.currency_code }
    refunded_registration_payment { nil }
    receipt do
      if refunded_registration_payment.present?
        create(:stripe_record, :refund, parent_record: refunded_registration_payment.receipt)
      else
        payment_intent.payment_record.child_records.first
      end
    end

    trait :refund do
      amount_lowest_denomination { -competition.base_entry_fee_lowest_denomination }
    end

    trait :with_donation do
      amount_lowest_denomination { competition.base_entry_fee_lowest_denomination * 2 }
    end

    trait :skip_create_hook do
      skip_auto_accept_hook { true }
    end

    after(:build) do |_payment, evaluator|
      evaluator.competition.auto_accept_registrations = false if evaluator.skip_auto_accept_hook
    end

    after(:create) do |_payment, evaluator|
      evaluator.competition.auto_accept_registrations = true if evaluator.skip_auto_accept_hook
    end
  end
end
