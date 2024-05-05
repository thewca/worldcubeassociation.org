# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaypalRecord do
  describe "#amount_to_paypal" do
    it 'returns USD as a decimal string' do
      ruby_amount = "1000"
      currency_code = "USD"
      expect(PaypalRecord.amount_to_paypal(ruby_amount, currency_code)).to eq("10.00")
    end

    it 'returns 3-digit USD as a decimal string' do
      ruby_amount = "500"
      currency_code = "USD"
      expect(PaypalRecord.amount_to_paypal(ruby_amount, currency_code)).to eq("5.00")
    end

    it 'returns JPY unchanged' do
      amount = "3000"
      currency_code = "JPY"
      expect(PaypalRecord.amount_to_paypal(amount, currency_code)).to eq("3000")
    end
  end
end
