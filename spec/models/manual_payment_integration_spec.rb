# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ManualPaymentIntegration do
  describe '#prepare_intent' do
    let(:competition) { create(:competition, :manual_payments) }
    let(:registration) { create(:registration, competition: competition) }
    let(:payment_account) { competition.payment_account_for(:manual) }

    before do
      payment_account.prepare_intent(registration, 1000, "USD", registration.user)
      @payment_intent = PaymentIntent.first
      @payment_record = @payment_intent.payment_record
    end

    it 'creates a PaymentIntent' do
      expect(@payment_intent.initiated_by).to eq(registration.user)
    end

    it 'creates a ManualPaymentRecord' do
      expect(@payment_record).to be_present
    end
  end
end
