# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationPayment do
  describe '#amount_available_for_refund' do
    let!(:competition) { create(:competition, :stripe_connected) }
    let(:registration) { create(:registration, competition: competition) }
    let!(:registration_payment) { create(:registration_payment, registration: registration) }

    it 'returns 1000 when no refund' do
      expect(registration_payment.amount_available_for_refund).to eq(1000)
    end

    it 'returns 500 when partially refunded' do
      create(:registration_payment, :refund, registration: registration, amount_lowest_denomination: -500)
      expect(registration_payment.amount_available_for_refund).to eq(500)
    end

    it 'returns 0 when fully refunded' do
      create(:registration_payment, :refund, registration: registration)
      expect(registration_payment.amount_available_for_refund).to eq(0)
    end
  end

  describe '#status' do
    let!(:competition) { create(:competition, :stripe_connected) }
    let(:registration) { create(:registration, competition: competition) }
    let!(:registration_payment) { create(:registration_payment, registration: registration) }

    it 'returns confirmed status when associated with confirmed payment intent' do
      expect(registration_payment.status).to eq('succeeded')
    end

    it 'returns nil when there is no associated PaymentIntent' do
      registration_payment.payment_intent = nil
      expect(registration_payment.status).to be_nil
    end
  end
end
