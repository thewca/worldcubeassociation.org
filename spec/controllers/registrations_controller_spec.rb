# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationsController, :clean_db_with_truncation do
  context "signed in as organizer" do
    let!(:organizer) { create(:user) }
    let(:competition) { create(:competition, :registration_open, :visible, organizers: [organizer], events: Event.where(id: %w[222 333])) }
    let(:zzyzx_user) { create(:user, name: "Zzyzx") }
    let(:registration) { create(:registration, competition: competition, user: zzyzx_user) }

    before :each do
      sign_in organizer
    end

    it 'allows access to competition organizer' do
      get :index, params: { competition_id: competition }
      expect(response).to have_http_status :ok
    end
  end

  context "register" do
    let(:competition) { create(:competition, :confirmed, :visible, :registration_open) }

    it "redirects to competition root if competition is not using WCA registration" do
      competition.use_wca_registration = false
      competition.save!

      get :register, params: { competition_id: competition.id }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"
    end

    it "works when not logged in" do
      get :register, params: { competition_id: competition.id }
      expect(assigns(:registration)).to be_nil
    end
  end

  describe 'POST #refund_payment' do
    context 'when signed in as a competitor' do
      let(:competition) { create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w[222 333])) }
      let!(:user) { create(:user, :wca_id) }
      let!(:registration) { create(:registration, competition: competition, user: user) }

      it 'does not allow access and redirects to root_url' do
        sign_in user

        post :refund_payment, params: {
          competition_id: competition.id,
          payment_integration: :stripe,
          payment_id: registration.id,
        }

        expect(response).to redirect_to root_url
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
        before :each do
          sign_in organizer

          post :load_payment_intent, params: {
            id: registration.id,
            payment_integration: :stripe,
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          get :payment_completion, params: {
            competition_id: competition.id,
            payment_integration: :stripe,
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          @payment = registration.reload.registration_payments.first
        end

        it 'issues a full refund' do
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: competition.base_entry_fee.cents } }
          expect(response).to be_successful
          refund = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee
          expect(refund.amount).to eq competition.base_entry_fee.cents
          expect(@payment.reload.amount_available_for_refund).to eq 0
          # Check that the website actually records who made the refund
          expect(registration.registration_payments.last.user).to eq organizer
        end

        it 'issues a 50% refund' do
          refund_amount = competition.base_entry_fee.cents / 2
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to be_successful
          refund = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee / 2
          expect(refund.amount).to eq competition.base_entry_fee.cents / 2
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents / 2
        end

        it 'disallows negative refund' do
          refund_amount = -1
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to have_http_status(:bad_request)
          expect(response.parsed_body).to eq({ "error" => "refund_amount_too_low" })
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it 'disallows a refund more than the payment' do
          refund_amount = competition.base_entry_fee.cents * 2
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to have_http_status(:bad_request)
          expect(response.parsed_body).to eq({ "error" => "refund_amount_too_high" })
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it "disallows a refund after clearing the Stripe account id" do
          ClearConnectedPaymentIntegrations.perform_now
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: competition.base_entry_fee.cents } }
          expect(response).to have_http_status(:not_found)
          expect(response.parsed_body).to eq({ "error" => "provider_disconnected" })
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it "does not create a duplicate refund if the webhook arrives first" do

        end
      end
    end
  end
end
