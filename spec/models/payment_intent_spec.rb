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

    # it '#processing returns all records which are started and not canceled or confirmed' do
    # end
  end
end
