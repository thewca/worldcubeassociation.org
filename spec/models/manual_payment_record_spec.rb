# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ManualPaymentRecord do
  describe 'status mappings' do
    it 'contains all wca_statuses' do
      expect(ManualPaymentRecord::WCA_TO_MANUAL_PAYMENT_STATUS_MAP.keys.sort.map(&:to_s)).to eq(PaymentIntent.wca_statuses.values.sort)
    end

    it 'contains all manual_statuses' do
      expect(ManualPaymentRecord.manual_statuses.keys.sort).to eq(ManualPaymentRecord::WCA_TO_MANUAL_PAYMENT_STATUS_MAP.values.flatten.sort)
    end
  end
end
