# frozen_string_literal: true

FactoryBot.define do
  factory :competition_payment_integration do
    transient do
      account { nil }
    end

    connected_account_type { nil }
    connected_account_id { nil }
    competition_id { nil }
  end

  trait :stripe do
    connected_account_type { connected_account.class }
    connected_account_id { connected_account.id }
  end
end
