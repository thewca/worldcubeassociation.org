# frozen_string_literal: true

require 'rails_helper'

# The currency amounts are all roughly equivalent to USD $15
# at the time of writing these tests.
RSpec.describe StripeCharge do
  it "handles HUF as a special currency" do
    six_thousand_huf = Money.from_amount(6_000, 'HUF')

    stripe_amount = StripeCharge.amount_to_stripe(six_thousand_huf.cents, six_thousand_huf.currency.iso_code)
    expect(stripe_amount).to eq(600_000)
  end

  it "handles UGX as a special currency" do
    sixty_thousand_ugx = Money.from_amount(60_000, 'UGX')

    stripe_amount = StripeCharge.amount_to_stripe(sixty_thousand_ugx.cents, sixty_thousand_ugx.currency.iso_code)
    expect(stripe_amount).to eq(6_000_000)
  end

  it "throws exception when sub-hundred currency not divisible" do
    expect do
      # Funnily enough, our RubyMoney gem doesn't even support HUF sub-units, but Stripe still insists on
      # *not* charging sub-units in the lowest two decimal places. So we manually insert a fraction to check for the error.
      StripeCharge.amount_to_stripe(6000.45, 'HUF')
    end.to raise_error(RuntimeError)
  end

  it "handles USD as a normal currency" do
    fifteen_usd = Money.from_amount(15, 'USD')

    stripe_amount = StripeCharge.amount_to_stripe(fifteen_usd.cents, fifteen_usd.currency.iso_code)
    expect(stripe_amount).to eq(1_500)
  end

  it "handles EUR as a normal currency" do
    fifteen_eur = Money.from_amount(15, 'EUR')

    stripe_amount = StripeCharge.amount_to_stripe(fifteen_eur.cents, fifteen_eur.currency.iso_code)
    expect(stripe_amount).to eq(1_500)
  end

  it "handles JPY as a normal currency" do
    two_thousand_yen = Money.from_amount(2_000, 'JPY')

    stripe_amount = StripeCharge.amount_to_stripe(two_thousand_yen.cents, two_thousand_yen.currency.iso_code)
    expect(stripe_amount).to eq(2_000)
  end

  it "handles TWD as a normal currency" do
    # TWD is one of the fancy-snowflake sub-hundred currecies in the Stripe API
    # but it is also the only one that actually has subunits in the RubyMoney gem so it needs no special treatment.
    five_hundred_twd = Money.from_amount(500, 'TWD')

    stripe_amount = StripeCharge.amount_to_stripe(five_hundred_twd.cents, five_hundred_twd.currency.iso_code)
    expect(stripe_amount).to eq(50_000)
  end
end
