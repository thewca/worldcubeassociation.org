
# frozen_string_literal: true

FactoryBot.define do
  factory :manual_payment_record do
    payment_reference { nil }
    manual_status { 'created' }
  end
end
