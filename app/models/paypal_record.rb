# frozen_string_literal: true

class PaypalRecord < ApplicationRecord
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

  # See https://developer.paypal.com/docs/api/orders/v2/#orders_get!c=200&path=status&t=response
  enum paypal_status: {
    created: "CREATED",
    payer_action_required: "PAYER_ACTION_REQUIRED",
    saved: "SAVED",
    approved: "APPROVED",
    completed: "COMPLETED",
    voided: "VOIDED",
  }

  WCA_TO_PAYPAL_STATUS_MAP = {
    created: %w[created],
    pending: %w[payer_action_required],
    processing: %w[saved],
    partial: %w[],
    failed: %w[],
    succeeded: %w[approved completed], # TODO: In PayPal, WE are the ones who have to make the payment succeed, by "capturing" an already approved payment
    canceled: %w[voided],
  }.freeze

  enum paypal_record_type: {
    # We cannot call this "order" because that's a reserved keyword in SQL and Rails AR
    paypal_order: "paypal_order",
    capture: "capture",
    refund: "refund",
  }

  # We don't need the native JSON type on DB level, so we serialize in Ruby.
  # Also saves us from some pains because JSON columns are highly inconsistent among MySQL and MariaDB.
  serialize :parameters, coder: JSON

  has_one :registration_payment, as: :receipt
  has_one :payment_intent, as: :payment_record

  belongs_to :parent_record, class_name: "PaypalRecord", inverse_of: :child_records, optional: true
  has_many :child_records, class_name: "PaypalRecord", inverse_of: :parent_record, foreign_key: :parent_record_id

  def determine_wca_status
    result = WCA_TO_PAYPAL_STATUS_MAP.find { |key, values| values.include?(self.paypal_status) }
    result&.first || raise("No associated wca_status for paypal_status: #{self.paypal_status} - our tests should prevent this from happening!")
  end

  def money_amount
    ruby_amount = PaypalRecord.amount_to_ruby(
      self.amount_paypal_denomination,
      self.currency_code,
    )

    Money.new(ruby_amount, self.currency_code)
  end

  # Paypal expects a decimal value in the format of a string, so we return a string from this function
  def self.amount_to_paypal(amount, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      format("%.2f", amount.to_i / 100.0).to_s
    else
      amount.to_s
    end
  end

  def self.amount_to_ruby(amount, currency_code)
    if PAYPAL_CURRENCY_CATEGORIES[:decimal].include?(currency_code)
      (amount.to_f * 100).to_i
    else
      amount.to_i
    end
  end

  def self.parse_paypal_datetime(raw_datetime)
    return nil if raw_datetime.nil?

    DateTime.parse(raw_datetime)
  end

  def self.create_from_api(api_record, record_type, parameters, merchant_id, parent_record = nil)
    default_unit = api_record.dig('purchase_units', 0) || api_record

    PaypalRecord.create!(
      paypal_record_type: record_type,
      parameters: parameters,
      paypal_id: api_record['id'],
      amount_paypal_denomination: default_unit['amount']['value'],
      currency_code: default_unit['amount']['currency_code'],
      paypal_status: api_record['status'],
      merchant_id: merchant_id,
      parent_record: parent_record,
      created_at_remote: PaypalRecord.parse_paypal_datetime(api_record["create_time"]),
      updated_at_remote: PaypalRecord.parse_paypal_datetime(api_record["update_time"]),
    )
  end
end
