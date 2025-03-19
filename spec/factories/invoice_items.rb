# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_item do
    transient do
      custom_registration { nil }
    end

    registration { custom_registration }
    amount_lowest_denomination { 0 }
    currency_code { registration.competition.currency_code }
    status { 0 }
    display_name { "invoice_item_factory" }

    trait :entry do
      amount_lowest_denomination { registration.competition.base_entry_fee_lowest_denomination }
      currency_code { registration.competition.currency_code }
      display_name { "#{registration.competition_id} entry" }
    end
  end
end
