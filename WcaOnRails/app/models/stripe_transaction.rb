# frozen_string_literal: true

class StripeTransaction < ApplicationRecord
  enum status: {
    unknown: "unknown",
    payment_intent_registered: "payment_intent_registered",
    success: "success",
    failure: "failure",
  }

  # Actual values are according to Stripe API documentation as of 2023-03-12.
  enum api_type: {
    payment_intent: "payment_intent",
    charge: "charge",
    refund: "refund",
  }

  has_one :registration_payment, as: :receipt
  belongs_to :parent_transaction, class_name: "StripeTransaction", optional: true

  # We don't need the native JSON type on DB level, so we serialize in Ruby.
  # Also saves us from some pains because JSON columns are highly inconsistent among MySQL and MariaDB.
  serialize :parameters, JSON

  # sub-hundred units special cases per https://stripe.com/docs/currencies#special-cases
  # that are not compatible with the subunits from our RubyMoney gem.
  # In other words, `Money::Currency.find(iso_code).subunit_to_unit`
  # is not what the Stripe API expects in these cases.
  # Note that TWD from the Stripe docs is not listed here because it is implemented with cents in RubyMoney.
  ZERO_DECIMAL_CURRENCIES = %w[HUF UGX].freeze

  def self.amount_to_stripe(amount_lowest_denomination, iso_currency)
    # Stripe has a small handful of fancy snowflake currencies
    # that need to be submitted as multiples of 100 even though they technically have subunits.
    # The details are documented at https://stripe.com/docs/currencies#special-cases
    if ZERO_DECIMAL_CURRENCIES.include?(iso_currency)
      amount_times_hundred = amount_lowest_denomination * 100

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
    amount_lowest_denomination
  end

  def self.amount_to_ruby(amount_stripe_denomination, iso_currency)
    # For the specifics of these currencies, see the comments in `amount_to_stripe`
    if ZERO_DECIMAL_CURRENCIES.include?(iso_currency)
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
    amount_stripe_denomination
  end

  def self.create_receipt(api_transaction, parameters, status, account_id)
    StripeTransaction.create!(
      api_type: api_transaction.object,
      parameters: parameters,
      stripe_id: api_transaction.id,
      amount_stripe_denomination: api_transaction.amount,
      currency_code: api_transaction.currency,
      status: status,
      account_id: account_id,
    )
  end
end
