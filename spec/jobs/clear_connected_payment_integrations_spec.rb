# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ClearConnectedPaymentIntegrations, type: :job do
  describe '#perform' do
    it 'does not get disconnected if younger than disconnect_delay' do
      competition = FactoryBot.create(:competition, :payment_disconnect_delay_not_elapsed, :stripe_connected)

      described_class.perform_now
      expect(competition.competition_payment_integrations.count).to eq(1)
    end

    it 'disconnects all integrations  older than disonnect_delay' do
      competition1 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, :paypal_connected)
      competition2 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, :paypal_connected, id: "TestComp1")
      competition3 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected, id: "TestComp2")

      described_class.perform_now
      expect(competition1.competition_payment_integrations).to eq([])
      expect(competition2.competition_payment_integrations).to eq([])
      expect(competition3.competition_payment_integrations).to eq([])
    end

    it 'in a mix of comps, only disconnected those older than disconnect_delay' do
      competition1 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, :paypal_connected)
      competition2 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, :paypal_connected, id: "TestComp1")
      competition3 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected, id: "TestComp2")
      competition4 = FactoryBot.create(:competition, :payment_disconnect_delay_not_elapsed, :paypal_connected, :stripe_connected, id: "TestComp3")

      described_class.perform_now
      expect(competition1.competition_payment_integrations).to eq([])
      expect(competition2.competition_payment_integrations).to eq([])
      expect(competition3.competition_payment_integrations).to eq([])
      expect(competition4.competition_payment_integrations.count).to eq(2)
    end
  end
end
