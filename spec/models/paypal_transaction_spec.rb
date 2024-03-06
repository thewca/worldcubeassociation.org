# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaypalTransaction do
  describe "#paypal_amount" do
    it 'returns USD as a decimal string' do
      amount_in_cents = "1000"
      currency_code = "USD"
      expect(PaypalTransaction.paypal_amount(amount_in_cents, currency_code)).to eq("10.00")
    end

    it 'returns 3-digit USD as a decimal string' do
      amount_in_cents = "500"
      currency_code = "USD"
      expect(PaypalTransaction.paypal_amount(amount_in_cents, currency_code)).to eq("5.00")
    end

    it 'returns JPY unchanged' do
      amount_in_cents = "3000"
      currency_code = "JPY"
      expect(PaypalTransaction.paypal_amount(amount_in_cents, currency_code)).to eq("3000")
    end
  end
end
