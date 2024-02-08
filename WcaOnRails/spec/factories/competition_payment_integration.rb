# frozen_string_literal: true

FactoryBot.define do
  factory :competition_payment_integration do
    trait {

    }
    connected_account_type { nil }
    connected_account_id { nil }
    competition_id { nil }
  end

  trait :paypal do

  end

end
