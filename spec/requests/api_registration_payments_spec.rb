# frozen_string_literal: true

require 'rails_helper'

# Ported from a controller spec when the refund action moved from `RegistrationsController` to the
# v1 API. It has to be a request spec now, because setting a payment up still drives the monolith's
# own payment-intent and payment-completion routes.
RSpec.describe 'API Registration Payments', :clean_db_with_truncation do
  describe 'POST #refund' do
    context 'when signed in as a competitor' do
      let(:competition) { create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w[222 333])) }
      let!(:user) { create(:user, :wca_id) }
      let!(:registration) { create(:registration, competition: competition, user: user) }

      it 'does not allow access' do
        sign_in user

        post payment_refund_api_v1_registration_path(registration, :stripe, registration.id)

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { create(:user) }
      let(:competition) do
        create(:competition, :stripe_connected, :visible,
               organizers: [organizer],
               events: Event.where(id: %w[222 333]),
               use_wca_registration: true,
               starts: (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS + 1).days.ago,
               registration_close: (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS + 3).days.ago)
      end
      let!(:registration) { create(:registration, competition: competition, user: organizer) }

      context "processes a payment" do
        before do
          sign_in organizer

          post registration_payment_intent_path(registration, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          get registration_payment_completion_path(competition, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          @payment = registration.reload.registration_payments.first
        end

        def refund(amount, payment_id: @payment.receipt.id)
          post payment_refund_api_v1_registration_path(registration, :stripe, payment_id),
               params: { payment: { refund_amount: amount } }
        end

        it 'issues a full refund' do
          refund(competition.base_entry_fee.cents)

          expect(response).to be_successful
          refund_record = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee
          expect(refund_record.amount).to eq competition.base_entry_fee.cents
          expect(@payment.reload.amount_available_for_refund).to eq 0
          # Check that the website actually records who made the refund
          expect(registration.registration_payments.last.user).to eq organizer
        end

        it 'issues a 50% refund' do
          refund(competition.base_entry_fee.cents / 2)

          expect(response).to be_successful
          refund_record = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee / 2
          expect(refund_record.amount).to eq competition.base_entry_fee.cents / 2
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents / 2
        end

        it 'disallows negative refund' do
          refund(-1)

          expect(response).to have_http_status(:bad_request)
          expect(response.parsed_body).to eq({ "error" => "refund_amount_too_low" })
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it 'disallows a refund more than the payment' do
          refund(competition.base_entry_fee.cents * 2)

          expect(response).to have_http_status(:bad_request)
          expect(response.parsed_body).to eq({ "error" => "refund_amount_too_high" })
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it "disallows a refund after clearing the Stripe account id" do
          ClearConnectedPaymentIntegrations.perform_now
          refund(competition.base_entry_fee.cents)

          expect(response).to have_http_status(:not_found)
          expect(response.parsed_body).to eq({ "error" => "provider_disconnected" })
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it "refuses to refund a charge that belongs to another registration" do
          other_registration = create(:registration, competition: competition)

          post payment_refund_api_v1_registration_path(other_registration, :stripe, @payment.receipt.id),
               params: { payment: { refund_amount: competition.base_entry_fee.cents } }

          expect(response).to have_http_status(:not_found)
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end
      end
    end
  end
end
