# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ManualPaymentIntegration do
  describe '#prepare_intent' do
    let(:competition) { create(:competition, :manual_payments) }
    let(:registration) { create(:registration, competition: competition) }
    let(:payment_account) { competition.payment_account_for(:manual) }

    context 'no payment intent exists' do
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

    context 'payment already exists' do
      let!(:payment_intent) { create(:payment_intent, :manual_with_ref, holder: registration)}

      it 'reuses the existing PaymentIntent' do
        prepared_intent = payment_account.prepare_intent(registration, 1000, "USD", registration.user)
        expect(prepared_intent).to eq(payment_intent)
        expect(PaymentIntent.count).to be(1)
      end

      it 'resuses the existing ManualPaymentRecord' do
        expect(ManualPaymentRecord.count).to be(1)
      end
    end
  end
end
