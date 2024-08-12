# frozen_string_literal: true

class StripeRecord < ApplicationRecord
  # NOTE: Should the list items be the keys or values of stripe_status? Should stripe_status be an enum or just a list?
  # TODO: Add a link to the Stripe status definitions/documentation
  WCA_TO_STRIPE_STATUS_MAP = {
    created: %w[requires_payment_method legacy_payment_intent_registered legacy_unknown],
    pending: %w[pending requires_capture requires_confirmation requires_action],
    processing: %w[processing],
    partial: %w[],
    failed: %w[legacy_failure failed],
    succeeded: %w[legacy_success succeeded],
    canceled: %w[canceled],
  }.freeze

  enum stripe_status: {
    requires_payment_method: "requires_payment_method",
    requires_confirmation: "requires_confirmation",
    requires_action: "requires_action",
    processing: "processing",
    requires_capture: "requires_capture",
    canceled: "canceled",
    succeeded: "succeeded",
    pending: "pending",
    failed: "failed",
    legacy_unknown: "unknown",
    legacy_payment_intent_registered: "payment_intent_registered",
    legacy_success: "success",
    legacy_failure: "failure",
  }

  # Actual values are according to Stripe API documentation as of 2023-03-12.
  enum stripe_record_type: {
    payment_intent: "payment_intent",
    charge: "charge",
    refund: "refund",
  }

  has_one :registration_payment, as: :receipt
  has_one :payment_intent, as: :payment_record

  belongs_to :parent_record, class_name: "StripeRecord", optional: true
  has_many :child_records, class_name: "StripeRecord", inverse_of: :parent_record, foreign_key: :parent_record_id

  has_many :stripe_webhook_events, inverse_of: :stripe_record, dependent: :nullify

  # We don't need the native JSON type on DB level, so we serialize in Ruby.
  # Also saves us from some pains because JSON columns are highly inconsistent among MySQL and MariaDB.
  serialize :parameters, coder: JSON

  def determine_wca_status
    result = WCA_TO_STRIPE_STATUS_MAP.find { |key, values| values.include?(self.stripe_status) }
    result&.first || raise("No associated wca_status for stripe_status: #{self.stripe_status} - our tests should prevent this from happening!")
  end

  def account_id
    super || parent_record&.account_id
  end

  def root_record
    parent_record&.root_record || self
  end

  def update_status(api_transaction)
    stripe_error = nil

    case self.stripe_record_type
    when 'payment_intent'
      stripe_error = api_transaction.last_payment_error&.code
    when 'charge'
      stripe_error = api_transaction.failure_message
    end

    self.update!(
      stripe_status: api_transaction.status,
      error: stripe_error,
    )
  end

  def retrieve_stripe
    case self.stripe_record_type
    when 'payment_intent'
      Stripe::PaymentIntent.retrieve(self.stripe_id, stripe_account: self.account_id)
    when 'charge'
      Stripe::Charge.retrieve(self.stripe_id, stripe_account: self.account_id)
    when 'refund'
      Stripe::Refund.retrieve(self.stripe_id, stripe_account: self.account_id)
    end
  end

  alias_method :retrieve_remote, :retrieve_stripe

  def update_amount_remote(amount_iso, currency_iso)
    if self.payment_intent?
      stripe_amount = StripeRecord.amount_to_stripe(amount_iso, currency_iso)

      update_intent_args = {
        amount: stripe_amount,
        currency: currency_iso,
      }

      Stripe::PaymentIntent.update(
        self.stripe_id,
        update_intent_args,
        stripe_account: self.account_id,
      )

      updated_parameters = self.parameters.deep_merge(update_intent_args)

      # Update our own journals so that we know we changed something
      self.update!(
        parameters: updated_parameters,
        amount_stripe_denomination: stripe_amount,
        currency_code: currency_iso,
      )
    end
  end

  def money_amount
    ruby_amount = StripeRecord.amount_to_ruby(
      self.amount_stripe_denomination,
      self.currency_code,
    )

    Money.new(ruby_amount, self.currency_code)
  end

  def ruby_amount_available_for_refund
    paid_amount = amount_stripe_denomination
    already_refunded = child_records.refund.sum(:amount_stripe_denomination)

    StripeRecord.amount_to_ruby(paid_amount - already_refunded, self.currency_code)
  end

  # sub-hundred units special cases per https://stripe.com/docs/currencies#special-cases
  # that are not compatible with the subunits from our RubyMoney gem.
  # In other words, `Money::Currency.find(iso_code).subunit_to_unit`
  # is not what the Stripe API expects in these cases.
  # Note that TWD from the Stripe docs is not listed here because it is implemented with cents in RubyMoney.
  ZERO_DECIMAL_CURRENCIES = %w[HUF UGX ISK].freeze

  def self.amount_to_stripe(amount_lowest_denomination, iso_currency)
    # Stripe has a small handful of fancy snowflake currencies
    # that need to be submitted as multiples of 100 even though they technically have subunits.
    # The details are documented at https://stripe.com/docs/currencies#special-cases
    if ZERO_DECIMAL_CURRENCIES.include?(iso_currency.upcase)
      amount_times_hundred = (amount_lowest_denomination.to_f * 100).to_i

      # Stripe API rejects payments that are below the hundreds sub-unit.
      # In practice this should never happen because the inflation on those currencies
      # makes it absolutely impractical for Delegates to charge 0.45 HUF for example.
      # If this error is actually ever thrown, talk to the Delegates of the competition in question.
      if amount_times_hundred % 100 != 0
        raise "Trying to charge an amount of #{amount_lowest_denomination} #{iso_currency}, which is smaller than what the Stripe API accepts for sub-hundred currencies"
      end

      return amount_times_hundred
    end

    # Stripe API will be happy as-is.
    amount_lowest_denomination.to_i
  end

  def self.amount_to_ruby(amount_stripe_denomination, iso_currency)
    # For the specifics of these currencies, see the comments in `amount_to_stripe`
    if ZERO_DECIMAL_CURRENCIES.include?(iso_currency.upcase)
      amount_div_hundred = amount_stripe_denomination.to_f / 100

      # We're losing precision after dividing it down to the "smaller" denomination.
      # Normally, this should not happen as the Stripe API docs specify that sub-hundreds
      # on the special currencies are not accepted and thus should never be returned by the API.
      if amount_div_hundred.truncate != amount_div_hundred
        raise "Trying to receive an amount of #{amount_stripe_denomination} #{iso_currency}, which is more precise than what the Stripe API returns for sub-hundred currencies"
      end

      return amount_div_hundred
    end

    # Stripe and ruby-money agree. All good.
    amount_stripe_denomination.to_i
  end

  def self.create_from_api(api_record, parameters, account_id, parent_record = nil)
    StripeRecord.create!(
      stripe_record_type: api_record.object,
      parameters: parameters,
      stripe_id: api_record.id,
      amount_stripe_denomination: api_record.amount,
      currency_code: api_record.currency,
      stripe_status: api_record.status,
      account_id: account_id,
      parent_record: parent_record,
    )
  end
end
