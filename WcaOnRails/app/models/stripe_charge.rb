# frozen_string_literal: true

class StripeCharge < ApplicationRecord
  enum status: {
    unknown: "unknown",
    payment_intent_registered: "payment_intent_registered",
    success: "success",
    failure: "failure",
  }

  # sub-hundred units special cases per https://stripe.com/docs/currencies#special-cases
  # that are not compatible with the subunits from our RubyMoney gem.
  # In other words, `Money::Currency.find(iso_code).subunit_to_unit`
  # is not what the Stripe API expects in these cases.
  # Note that TWD from the Stripe docs is not listed here because it is implemented with cents in RubyMoney.
  ZERO_DECIMAL_CURRENCIES = %w[HUF UGX].freeze

  # Stripe has a small handful of fancy snowflake currencies
  # that need to be submitted as multiples of 100 even though they technically have subunits.
  # The details are documented at https://stripe.com/docs/currencies#special-cases
  def self.amount_to_stripe(amount_lowest_denomination, iso_currency)
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
end
