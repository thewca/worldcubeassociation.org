# frozen_string_literal: true

require 'rails_helper'

# The currency amounts are all roughly equivalent to USD $15
# at the time of writing these tests.
RSpec.describe StripeCharge do
  it "handles HUF as a special currency" do
    six_thousand_huf = Money.new(6_000, 'HUF')

    stripe_amount = StripeCharge.amount_to_stripe(six_thousand_huf.cents, six_thousand_huf.currency.iso_code)
    expect(stripe_amount).to eq(600_000)
  end

  it "handles UGX as a special currency" do
    sixty_thousand_ugx = Money.new(60_000, 'UGX')

    stripe_amount = StripeCharge.amount_to_stripe(sixty_thousand_ugx.cents, sixty_thousand_ugx.currency.iso_code)
    expect(stripe_amount).to eq(6_000_000)
  end

  it "throws exception when sub-hundred currency not divisible" do
    expect {
      StripeCharge.amount_to_stripe(6000.45, 'HUF')
    }.to raise_error(RuntimeError)
  end

  it "handles USD as a normal currency" do
    fifteen_usd = Money.new(1_500, 'USD')

    stripe_amount = StripeCharge.amount_to_stripe(fifteen_usd.cents, fifteen_usd.currency.iso_code)
    expect(stripe_amount).to eq(1_500)
  end

  it "handles EUR as a normal currency" do
    fifteen_eur = Money.new(1_500, 'EUR')

    stripe_amount = StripeCharge.amount_to_stripe(fifteen_eur.cents, fifteen_eur.currency.iso_code)
    expect(stripe_amount).to eq(1_500)
  end

  it "handles JPY as a normal currency" do
    two_thousand_yen = Money.new(2_000, 'JPY')

    stripe_amount = StripeCharge.amount_to_stripe(two_thousand_yen.cents, two_thousand_yen.currency.iso_code)
    expect(stripe_amount).to eq(2_000)
  end
end
