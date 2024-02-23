# frozen_string_literal: true

class PaypalTransaction < ApplicationRecord
  has_many :paypal_captures

  # Defined in: https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
  PAYPAL_CURRENCY_CATEGORIES = {
    decimal: [ # Currencies that should be passed to paypal as decimal amounts (ie, cents/100)
      "AUD",
      "BRL",
      "CAD",
      "CNY",
      "CZK",
      "DKK",
      "EUR",
      "HKD",
      "ILS",
      "MYR",
      "MXN",
      "NZD",
      "NOK",
      "PHP",
      "PLN",
      "GBP",
      "SGD",
      "SEK",
      "CHF",
      "THB",
      "USD",
    ],
    cents_only: [ # Currencies that do not support decimals - should be passed as cents
      "JPY",
      "HUF",
      "TWD",
    ],
  }.freeze

  def self.get_paypal_amount(amount_in_cents, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      format("%.2f", amount_in_cents.to_i / 100.0)
    else
      amount_in_cents
    end
  end

  def self.get_amount_in_cents(paypal_amount, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      (paypal_amount.to_f * 100).to_i.to_s
    else
      paypal_amount
    end
  end
end
