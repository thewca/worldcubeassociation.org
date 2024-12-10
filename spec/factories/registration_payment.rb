# frozen_string_literal: true

FactoryBot.define do
  factory :registration_payment do
    transient do
      registration { nil }
      competition { nil }
    end

    registration_id { registration.id }
    user_id { registration.user_id }
    amount_lowest_denomination { competition.base_entry_fee_lowest_denomination }
    currency_code { competition.currency_code }

    trait :refund do
      amount_lowest_denomination { -competition.base_entry_fee_lowest_denomination }
    end

    trait :with_donation do
      amount_lowest_denomination { competition.base_entry_fee_lowest_denomination*2 }
    end

    trait :skip_create_hook do
      after(:build) { |payment| payment.class.skip_callback(:create, :after, :attempt_auto_accept) }
      after(:create) { |payment| payment.class.set_callback(:create, :after, :attempt_auto_accept) }
    end
  end
end
