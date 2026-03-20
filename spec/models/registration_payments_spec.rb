# frozen_string_literal: true

require 'rails_helper'
require 'active_support/testing/time_helpers'

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

    it 'includes is_completed: false refunds' do
      create(:registration_payment, :refund, is_completed: false, registration: registration)
      expect(registration_payment.amount_available_for_refund).to eq(0)
    end
  end

  describe 'paid_at timestamp' do
    let!(:competition) { create(:competition, :stripe_connected) }
    let(:registration) { create(:registration, competition: competition) }

    describe 'setting upon creation' do
      it 'sets paid_at if is_completed is true' do
        freeze_time do
          completed_payment = create(:registration_payment, registration: registration)
          expect(completed_payment.paid_at).to eq(Time.zone.now)
        end
      end

      it 'does not set paid_at if is_completed is false' do
        freeze_time do
          incomplete_payment = create(:registration_payment, registration: registration, is_completed: false)
          expect(incomplete_payment.paid_at).to be_nil
        end
      end
    end

    describe 'setting upon update' do
      let(:incomplete) { create(:registration_payment, registration: registration, is_completed: false) }
      let(:complete) { create(:registration_payment, registration: registration) }

      it 'sets paid at when is_completed becomes true' do
        expect(incomplete.paid_at).to be_nil

        freeze_time do
          incomplete.update!(is_completed: true)
          expect(incomplete.paid_at).to eq(Time.zone.now)
        end
      end

      it 'does not change paid_at if other fields are changed' do
        original_time = complete.paid_at
        expect(original_time).to be_present

        freeze_time do
          complete.update!(amount_lowest_denomination: 1001)
          expect(complete.paid_at).to eq(original_time)
        end
      end
    end
  end

  describe 'over-refund validations' do
    let(:competition) { create(:competition, :stripe_connected) }
    let(:registration) { create(:registration, competition: competition) }
    let!(:registration_payment) { create(:registration_payment, registration: registration) }

    it 'complains when trying to create a refund that would go over the available amount' do
      base_amount = registration_payment.amount_lowest_denomination
      refunding_payment = build(:registration_payment, :refund, registration: registration, amount_lowest_denomination: base_amount * 2)

      expect(refunding_payment).to be_invalid_with_errors(
        amount_lowest_denomination_abs: ["must be less than or equal to #{base_amount}"],
      )
    end

    it 'does not complain when trying to update a previously issued refund that would go over the available amount' do
      full_refund = create(:registration_payment, :refund, registration: registration)

      # Manually override the value to something negative, by some admin in the UI who really knows what they're doing
      update_successful = full_refund.update(amount_lowest_denomination: registration_payment.amount_lowest_denomination * -2)

      expect(update_successful).to be_truthy
      expect(registration_payment.amount_available_for_refund).to be_negative
    end
  end
end
