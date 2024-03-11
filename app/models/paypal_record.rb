# frozen_string_literal: true

class PaypalRecord < ApplicationRecord
  belongs_to :parent_record, class_name: "PaypalRecord", optional: true
  has_many :child_records, class_name: "PaypalRecord", inverse_of: :parent_record, foreign_key: :parent_record_id

  RECORD_TYPES = [
    :payment,
    :refund,
    :capture,
  ].freeze

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

  # Paypal expects a decimal value in the format of a string, so we return a string from this function
  def self.paypal_amount(amount, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      format("%.2f", amount.to_i / 100.0).to_s
    else
      amount.to_s
    end
  end

  def self.ruby_amount(amount, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      (amount.to_i * 100)
    else
      amount.to_i
    end
  end

  def capture_id
    # NOTE: This only ever returns the id of the first capture associated with a record
    # TODO: Add error so that this method can only be called for an order or receipt, not for a capture
    child_records.first.record_id
  end
end
