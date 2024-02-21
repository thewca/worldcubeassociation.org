# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaypalInterface do
  describe "#paypal_amount" do
    it 'returns USD as a decimal string' do
      amount_in_cents = "1000"
      currency_code = "USD"
      expect(PaypalInterface.paypal_amount(amount_in_cents, currency_code)).to eq("10.00")
    end

    it 'returns 3-digit USD as a decimal string' do
      amount_in_cents = "500"
      currency_code = "USD"
      expect(PaypalInterface.paypal_amount(amount_in_cents, currency_code)).to eq("5.00")
    end

    it 'returns JPY unchanged' do
      amount_in_cents = "3000"
      currency_code = "JPY"
      expect(PaypalInterface.paypal_amount(amount_in_cents, currency_code)).to eq("3000")
    end

    # it 'throws an error if a decimal amount is passed' do
    # end

    # # TODO: Use shared examples for this, and create a list separate from the list maintained in PaypalInterface
    # it 'checks that all currencies are correctly categorized as decimal/cents' do
    # end
    # TODO: Add case where the entry fee is in single or double-digit cents
  end
end
