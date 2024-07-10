# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaypalRecord do
  describe 'status mappings' do
    it 'contains all wca_statuses' do
      expect(PaypalRecord::WCA_TO_PAYPAL_STATUS_MAP.keys.sort.map(&:to_s)).to eq(PaymentIntent.wca_statuses.values.sort)
    end

    it 'contains all paypal_statuses' do
      expect(PaypalRecord.paypal_statuses.keys.sort).to eq(PaypalRecord::WCA_TO_PAYPAL_STATUS_MAP.values.flatten.sort)
    end
  end

  describe 'validates paypal_status' do
    it 'allows a valid status' do
      record = PaypalRecord.new(paypal_status: 'SAVED')
      expect(record).to be_valid
    end

    it 'does not allow an invalid status' do
      expect {
        PaypalRecord.new(paypal_status: 'random_invalid_status')
      }.to raise_error(ArgumentError)
    end
  end

  describe '#amount_to_paypal' do
    it 'returns USD as a decimal string' do
      ruby_amount = '1000'
      currency_code = 'USD'
      expect(PaypalRecord.amount_to_paypal(ruby_amount, currency_code)).to eq('10.00')
    end

    it 'returns 3-digit USD as a decimal string' do
      ruby_amount = '500'
      currency_code = 'USD'
      expect(PaypalRecord.amount_to_paypal(ruby_amount, currency_code)).to eq('5.00')
    end

    it 'returns JPY unchanged' do
      amount = '3000'
      currency_code = 'JPY'
      expect(PaypalRecord.amount_to_paypal(amount, currency_code)).to eq('3000')
    end
  end
end
