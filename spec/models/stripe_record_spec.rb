# frozen_string_literal: true

require 'rails_helper'

# The currency amounts are all roughly equivalent to USD $15
# at the time of writing these tests.
RSpec.describe StripeRecord do
  describe 'status mappings' do
    it 'contains all wca_statuses' do
      expect(StripeRecord::WCA_TO_STRIPE_STATUS_MAP.keys.sort.map { |x| x.to_s }).to eq(PaymentIntent.wca_statuses.values.sort)
    end

    it 'contains all stripe_statuses' do
      mapped_statuses = []
      StripeRecord::WCA_TO_STRIPE_STATUS_MAP.each_value do |values_list|
        values_list.each do |value|
          mapped_statuses << value
        end
      end

      expect(StripeRecord.stripe_statuses.keys.sort).to eq(mapped_statuses.sort)
    end
  end

  describe 'validates stripe_status' do
    it 'allows a valid status' do
      record = StripeRecord.new(stripe_status: 'processing')
      expect(record).to be_valid
    end

    it 'does not allow an invalid status' do
      expect {
        StripeRecord.new(stripe_status: 'random_invalid_status')
      }.to raise_error(ArgumentError)
    end
  end

  describe 'currency functions' do
    it "handles HUF as a special currency" do
      six_thousand_huf = Money.from_amount(6_000, 'HUF')
      expect(six_thousand_huf.cents).to eq(6_000)

      stripe_amount = StripeRecord.amount_to_stripe(six_thousand_huf.cents, six_thousand_huf.currency.iso_code)
      expect(stripe_amount).to eq(600_000)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, six_thousand_huf.currency.iso_code)
      expect(ruby_amount).to eq(six_thousand_huf.cents)
    end

    it "handles UGX as a special currency" do
      sixty_thousand_ugx = Money.from_amount(60_000, 'UGX')
      expect(sixty_thousand_ugx.cents).to eq(60_000)

      stripe_amount = StripeRecord.amount_to_stripe(sixty_thousand_ugx.cents, sixty_thousand_ugx.currency.iso_code)
      expect(stripe_amount).to eq(6_000_000)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, sixty_thousand_ugx.currency.iso_code)
      expect(ruby_amount).to eq(sixty_thousand_ugx.cents)
    end

    it "handles ISK as a special currency" do
      two_thousand_isk = Money.from_amount(2_000, 'ISK')
      expect(two_thousand_isk.cents).to eq(2_000)

      stripe_amount = StripeRecord.amount_to_stripe(two_thousand_isk.cents, two_thousand_isk.currency.iso_code)
      expect(stripe_amount).to eq(200_000)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, two_thousand_isk.currency.iso_code)
      expect(ruby_amount).to eq(two_thousand_isk.cents)
    end

    it "throws exception when sub-hundred currency not divisible" do
      expect do
        # Funnily enough, our RubyMoney gem doesn't even support HUF sub-units, but Stripe still insists on
        # *not* charging sub-units in the lowest two decimal places. So we manually insert a fraction to check for the error.
        StripeRecord.amount_to_stripe(6000.45, 'HUF')
      end.to raise_error(RuntimeError)

      expect do
        # When Stripe returns something that is not cleanly divisible into cents (which, according to its own API docs,
        # it never should…) we throw an error and complain as a safeguard.
        StripeRecord.amount_to_ruby(6045, 'HUF')
      end.to raise_error(RuntimeError)
    end

    it "handles USD as a normal currency" do
      fifteen_usd = Money.from_amount(15, 'USD')
      expect(fifteen_usd.cents).to eq(1_500)

      stripe_amount = StripeRecord.amount_to_stripe(fifteen_usd.cents, fifteen_usd.currency.iso_code)
      expect(stripe_amount).to eq(1_500)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, fifteen_usd.currency.iso_code)
      expect(ruby_amount).to eq(fifteen_usd.cents)
    end

    it "handles EUR as a normal currency" do
      fifteen_eur = Money.from_amount(15, 'EUR')
      expect(fifteen_eur.cents).to eq(1_500)

      stripe_amount = StripeRecord.amount_to_stripe(fifteen_eur.cents, fifteen_eur.currency.iso_code)
      expect(stripe_amount).to eq(1_500)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, fifteen_eur.currency.iso_code)
      expect(ruby_amount).to eq(fifteen_eur.cents)
    end

    it "handles JPY as a normal currency" do
      two_thousand_yen = Money.from_amount(2_000, 'JPY')
      expect(two_thousand_yen.cents).to eq(2_000)

      stripe_amount = StripeRecord.amount_to_stripe(two_thousand_yen.cents, two_thousand_yen.currency.iso_code)
      expect(stripe_amount).to eq(2_000)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, two_thousand_yen.currency.iso_code)
      expect(ruby_amount).to eq(two_thousand_yen.cents)
    end

    it "handles TWD as a normal currency" do
      # TWD is one of the fancy-snowflake sub-hundred currecies in the Stripe API
      # but it is also the only one that actually has subunits in the RubyMoney gem so it needs no special treatment.
      five_hundred_twd = Money.from_amount(500, 'TWD')
      expect(five_hundred_twd.cents).to eq(50_000)

      stripe_amount = StripeRecord.amount_to_stripe(five_hundred_twd.cents, five_hundred_twd.currency.iso_code)
      expect(stripe_amount).to eq(50_000)
      expect(stripe_amount).to be_an(Integer)

      ruby_amount = StripeRecord.amount_to_ruby(stripe_amount, five_hundred_twd.currency.iso_code)
      expect(ruby_amount).to eq(five_hundred_twd.cents)
    end
  end
end
