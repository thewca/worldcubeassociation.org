# frozen_string_literal: true

FactoryBot.define do
  factory :manual_payment_record do
    transient do
      competition { nil }
    end

    payment_reference { nil }
    amount_iso_denomination { competition.base_entry_fee_lowest_denomination }
    currency_code { competition.currency_code }
  end
end
