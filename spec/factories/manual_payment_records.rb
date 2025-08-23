# frozen_string_literal: true

FactoryBot.define do
  factory :manual_payment_record do
    payment_reference { nil }
    manual_status { 'created' }
    amount_iso_denomination { 1000 }
    currency_code { 'USD' }
  end
end
