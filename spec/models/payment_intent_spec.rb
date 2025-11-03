# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentIntent do
  describe 'scopes' do
    before(:each) do
      create_list(:payment_intent, 5)
      create_list(:payment_intent, 2, :canceled)
      create_list(:payment_intent, 3, :confirmed)
    end

    it '#pending returns all records not canceled or confirmed' do
      expect(PaymentIntent.pending.length).to eq(5)
    end

    it '#started returns all records where a payment method has been selected' do
      create_list(:payment_intent, 4, :not_started)

      expect(PaymentIntent.started.length).to eq(10)
    end
  end

  describe 'enforce status consistency' do
    shared_examples '#create incompatible PaymentIntent' do |stripe_record_status, intent_status|
      it 'fails' do
        stripe_record = create(:stripe_record, stripe_status: stripe_record_status)
        intent = build(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        expect(intent).not_to be_valid
      end
    end

    shared_examples '#create compatible PaymentIntent' do |stripe_record_status, intent_status|
      it 'succeeds' do
        stripe_record = create(:stripe_record, stripe_status: stripe_record_status)
        intent = build(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        expect(intent).to be_valid
      end
    end

    context 'valid status combinations' do
      it_behaves_like '#create compatible PaymentIntent', 'requires_payment_method', 'created'
      it_behaves_like '#create compatible PaymentIntent', 'requires_confirmation', 'pending'
      it_behaves_like '#create compatible PaymentIntent', 'failed', 'failed'
    end

    context 'invalid status combinations create' do
      it_behaves_like '#create incompatible PaymentIntent', 'pending', 'created'
      it_behaves_like '#create incompatible PaymentIntent', 'requires_payment_method', 'pending'
      it_behaves_like '#create incompatible PaymentIntent', 'legacy_success', 'failed'
      it_behaves_like '#create incompatible PaymentIntent', 'failed', 'succeeded'
      it_behaves_like '#create incompatible PaymentIntent', 'succeeded', 'canceled'

      it 'cannot have confirmed_at without the `succeeded` status' do
        intent = build(:payment_intent, :canceled)
        intent.assign_attributes(confirmed_at: DateTime.now)
        expect(intent).not_to be_valid
      end

      it 'cannot be `succeeded` with nil confirmed_at' do
        intent = build(:payment_intent, :confirmed)
        intent.assign_attributes(confirmed_at: nil)
        expect(intent).not_to be_valid
      end

      it 'cannot have canceled_at without the `canceled` status' do
        intent = build(:payment_intent, :confirmed)
        intent.assign_attributes(canceled_at: DateTime.now)
        expect(intent).not_to be_valid
      end

      it 'cannot be `canceled` with nil canceled_at' do
        intent = build(:payment_intent, :canceled)
        intent.assign_attributes(canceled_at: nil)
        expect(intent).not_to be_valid
      end
    end

    shared_examples '#update PaymentIntent to incompatible status' do |stripe_record_status, intent_status, new_intent_status|
      it 'fails' do
        stripe_record = create(:stripe_record, stripe_status: stripe_record_status)
        intent = create(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        intent.assign_attributes(wca_status: new_intent_status)
        expect(intent).not_to be_valid
      end
    end

    context 'invalid status combinations update' do
      it_behaves_like '#update PaymentIntent to incompatible status', 'requires_payment_method', 'created', 'pending'
      it_behaves_like '#update PaymentIntent to incompatible status', 'requires_capture', 'requires_capture', 'partial'
      it_behaves_like '#update PaymentIntent to incompatible status', 'legacy_failure', 'failed', 'succeeded'
    end
  end

  describe 'update status and charges' do
    let(:intent) { create(:payment_intent, :pending) }
    # StripeUpdate is an arbitrary value - class type is not under test in this example
    let(:mock_update) { double("StripeUpdate", status: "requires_capture", last_payment_error: nil) }

    it 'updates pending to requires_capture' do
      expect(intent.wca_status).to eq('pending')
      intent.update_status_and_charges(nil, mock_update, nil)

      expect(intent.reload.wca_status).to eq('requires_capture')
    end
  end

  describe 'validations' do
    context 'manual payment uniqueness' do
      let(:manual_comp) { create(:competition, :manual_connected) }
      let(:stripe_comp) { create(:competition, :stripe_connected) }
      let(:reg) { create(:registration, competition: manual_comp) }
      let(:stripe_reg) { create(:registration, competition: stripe_comp) }
      let!(:manual_pi) { create(:payment_intent, :manual, holder: reg) }
      let!(:stripe_pi) { create(:payment_intent, holder: stripe_reg) }

      it 'only allows 1 payment intent for a manual payment per registration' do
        manual_record = ManualPaymentRecord.create(
          amount_iso_denomination: 1000, currency_code: 'usd', manual_status: :user_submitted, payment_reference: "ref",
        )

        expect do
          PaymentIntent.create!(
            holder: reg,
            payment_record: manual_record,
            client_secret: manual_record.id,
            initiated_by: reg.user,
            wca_status: manual_record.determine_wca_status,
          )
        end.to raise_error(ActiveRecord::RecordInvalid) do |error|
          expect(error.message).to eq('Validation failed: Holder has already been taken')
        end
      end

      it 'allows manual payment intents for different registrations' do
        reg2 = create(:registration, competition: manual_comp)

        manual_record = ManualPaymentRecord.create(
          amount_iso_denomination: 1000, currency_code: 'usd', manual_status: :user_submitted, payment_reference: "ref",
        )

        expect do
          PaymentIntent.create!(
            holder: reg2,
            payment_record: manual_record,
            client_secret: manual_record.id,
            initiated_by: reg2.user,
            wca_status: manual_record.determine_wca_status,
          )
        end.not_to raise_error
      end

      it 'allows multiple payment intents for the same registration with Stripe' do
        stripe_record = create(:stripe_record)

        expect do
          PaymentIntent.create!(
            holder: stripe_reg,
            payment_record: stripe_record,
            client_secret: 'test_secret',
            initiated_by: stripe_reg.user,
            wca_status: stripe_record.determine_wca_status,
          )
        end.not_to raise_error
      end

      it 'allows multiple payment intents with different payment record types' do
        manual_record = ManualPaymentRecord.create(
          amount_iso_denomination: 1000, currency_code: 'usd', manual_status: :user_submitted, payment_reference: "ref",
        )

        expect do
          PaymentIntent.create!(
            holder: stripe_reg,
            payment_record: manual_record,
            client_secret: manual_record.id,
            initiated_by: stripe_reg.user,
            wca_status: manual_record.determine_wca_status,
          )
        end.not_to raise_error
      end
    end
  end
end
