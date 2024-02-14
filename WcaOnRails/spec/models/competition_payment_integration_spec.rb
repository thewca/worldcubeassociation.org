# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Competition do
  describe '#disconnect' do
    it 'disconnects a stripe payment integration' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected)

      CompetitionPaymentIntegration.disconnect(competition, :stripe)
      expect(competition.competition_payment_integrations).to eq([])
    end

    it 'disconnects a paypal payment integration' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected)

      CompetitionPaymentIntegration.disconnect(competition, :paypal)
      expect(competition.competition_payment_integrations).to eq([])
    end

    it 'disconnecting paypal leaves stripe connected' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected, :stripe_connected)

      CompetitionPaymentIntegration.disconnect(competition, :paypal)
      expect(CompetitionPaymentIntegration.paypal_connected?(competition)).to eq(false)
      expect(CompetitionPaymentIntegration.stripe_connected?(competition)).to eq(true)
    end

    it 'disconnecting stripe leaves paypal connected' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected, :stripe_connected)

      CompetitionPaymentIntegration.disconnect(competition, :stripe)
      expect(CompetitionPaymentIntegration.paypal_connected?(competition)).to eq(true)
      expect(CompetitionPaymentIntegration.stripe_connected?(competition)).to eq(false)
    end

    it 'fails silently on a competition with no payment integrations' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed)

      expect{ CompetitionPaymentIntegration.disconnect(competition, :stripe) }.not_to raise_error
    end
  end

  describe '#disconnect_all' do
    it 'disconnects both integrations on a comp with two integrations' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, :paypal_connected)
      expect(CompetitionPaymentIntegration.paypal_connected?(competition)).to eq(true)
      expect(CompetitionPaymentIntegration.stripe_connected?(competition)).to eq(true)

      CompetitionPaymentIntegration.disconnect_all(competition)
      expect(competition.competition_payment_integrations).to eq([])
    end
  end
end
