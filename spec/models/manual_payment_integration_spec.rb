# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ManualPaymentIntegration do
  let(:competition) { create(:competition, :manual_connected) }
  let(:registration) { create(:registration, competition: competition) }
  let(:payment_account) { competition.payment_account_for(:manual) }

  describe '#prepare_intent' do
    context 'no payment intent exists' do
      before do
        payment_account.prepare_intent(registration, 1000, "USD", registration.user, "test reference")
        @payment_intent = PaymentIntent.first
      end

      it 'creates a PaymentIntent' do
        expect(@payment_intent.initiated_by).to eq(registration.user)
      end

      it 'creates a `user_submitted` ManualPaymentRecord' do
        expect(@payment_intent.payment_record.manual_status).to eq('user_submitted')
      end
    end

    context 'payment already exists' do
      let!(:payment_intent) { create(:payment_intent, :manual, holder: registration) }

      it 'reuses the existing PaymentIntent' do
        prepared_intent = payment_account.prepare_intent(registration, 1000, "USD", registration.user, "test_reference")
        expect(prepared_intent).to eq(payment_intent)
        expect(PaymentIntent.count).to be(1)
      end

      it 'resuses the existing ManualPaymentRecord' do
        expect(ManualPaymentRecord.count).to be(1)
      end
    end
  end

  describe '#find_payment_intent_from_request' do
    let(:params) do
      {
        registration_id: registration.id,
        payment_reference: "test reference"
      }.with_indifferent_access # To mimic behaviour of params payload
    end

    it 'returns a `requires_capture` payment intent' do
      intent = payment_account.find_payment_intent_from_request(params)

      expect(intent.wca_status).to eq('requires_capture')
    end

    it 'persists the payment intent to the database' do
      expect(registration.payment_intents.any?).to be(false)

      payment_account.find_payment_intent_from_request(params)

      expect(registration.payment_intents.count).to be(1)
    end

    it 'creates a `user_submitted` manual payment record' do
      payment_account.find_payment_intent_from_request(params)
      expect(registration.payment_intents.first.payment_record.manual_status).to eq('user_submitted')
      expect(registration.payment_intents.first.payment_record.payment_reference).to eq('test reference')
    end
  end
end
