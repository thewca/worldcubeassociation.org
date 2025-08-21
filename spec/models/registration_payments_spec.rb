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

    it 'does not included is_succeeded: false refunds' do
      create(:registration_payment, :refund, is_captured: false, registration: registration)
      expect(registration_payment.amount_available_for_refund).to eq(1000)
    end
  end
end
