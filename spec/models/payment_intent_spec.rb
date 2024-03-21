# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentIntent do
  describe 'scopes' do
    before(:all) do
      FactoryBot.create_list(:payment_intent, 5)
      FactoryBot.create_list(:payment_intent, 2, :canceled)
      FactoryBot.create_list(:payment_intent, 3, :confirmed)
    end

    it '#pending returns all records not canceled or confirmed' do
      expect(PaymentIntent.pending.length).to eq(5)
    end

    it '#started returns all records where a payment method has been selected' do
      FactoryBot.create_list(:payment_intent, 4, :not_started)

      expect(PaymentIntent.started.length).to eq(10)
    end
  end

  describe 'enforce status consistency' do
    shared_examples '#create incompatible PaymentIntent' do |stripe_record_status, intent_status|
      it 'fails' do
        stripe_record = FactoryBot.create(:stripe_record, stripe_status: stripe_record_status)
        intent = FactoryBot.build(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        expect(intent).not_to be_valid
      end
    end

    shared_examples '#create compatible PaymentIntent' do |stripe_record_status, intent_status|
      it 'succeeds' do
        stripe_record = FactoryBot.create(:stripe_record, stripe_status: stripe_record_status)
        intent = FactoryBot.build(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        expect(intent).to be_valid
      end
    end

    context 'valid status combinations' do
      it_behaves_like '#create compatible PaymentIntent', 'requires_payment_method', 'created'
      it_behaves_like '#create compatible PaymentIntent', 'requires_confirmation', 'pending'
      it_behaves_like '#create compatible PaymentIntent', 'failed', 'failed'
      it_behaves_like '#create compatible PaymentIntent', 'legacy_success', 'succeeded'
      it_behaves_like '#create compatible PaymentIntent', 'canceled', 'canceled'
    end

    context 'invalid status combinations' do
      it_behaves_like '#create incompatible PaymentIntent', 'pending', 'created'
      it_behaves_like '#create incompatible PaymentIntent', 'requires_payment_method', 'pending'
      it_behaves_like '#create incompatible PaymentIntent', 'legacy_success', 'failed'
      it_behaves_like '#create incompatible PaymentIntent', 'canceled', 'succeeded'
      it_behaves_like '#create incompatible PaymentIntent', 'failed', 'canceled'
    end

    shared_examples '#update PaymentIntent to incompatible status' do |stripe_record_status, intent_status, new_intent_status|
      it 'fails' do
        stripe_record = FactoryBot.create(:stripe_record, stripe_status: stripe_record_status)
        intent = FactoryBot.create(:payment_intent, payment_record: stripe_record, wca_status: intent_status)
        intent.assign_attributes(wca_status: new_intent_status)
        expect(intent).not_to be_valid
      end
    end

    context 'invalid status combinations' do
      it_behaves_like '#update PaymentIntent to incompatible status', 'requires_payment_method', 'created', 'pending'
      it_behaves_like '#update PaymentIntent to incompatible status', 'requires_capture', 'pending', 'partial'
      it_behaves_like '#update PaymentIntent to incompatible status', 'legacy_failure', 'failed', 'succeeded'
      it_behaves_like '#update PaymentIntent to incompatible status', 'legacy_success', 'succeeded', 'canceled'
      it_behaves_like '#update PaymentIntent to incompatible status', 'canceled', 'canceled', 'created'
    end
  end
end