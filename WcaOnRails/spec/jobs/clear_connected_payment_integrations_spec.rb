# frozen_string_literal: true

require 'rails_helper'

# TODO: Refactor some of the tests into competition_payment_integration model spec
RSpec.describe ClearConnectedPaymentIntegrations, type: :job do
  describe '#perform' do
    context 'competition younger than 21 days' do
      it 'does not get disconnected' do
        competition = FactoryBot.create(:competition, :payment_disconnect_delay_not_elapsed , :stripe_connected)

        described_class.perform_now
        expect(competition.competition_payment_integrations.count).to eq(1)
      end
    end

    context 'competition older than 21 days' do
      it 'disconnects a single stripe payment integration' do
        competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected)

        described_class.perform_now
        expect(competition.competition_payment_integrations).to eq([])
      end

      it 'disconnects a single paypal payment integration' do
        competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected)

        described_class.perform_now
        expect(competition.competition_payment_integrations).to eq([])
      end

      it 'disconnects both integrations on a comp with two integrations' do
        competition = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected)

        # Connect another account
        paypal_account = ConnectedPaypalAccount.new(
          paypal_merchant_id: "95XC2UKUP2CFW",
          permissions_granted: "PPCP",
          account_status: "test",
          consent_status: "test",
        )
        competition.competition_payment_integrations.new(connected_account: paypal_account)
        competition.save

        described_class.perform_now
        expect(competition.competition_payment_integrations).to eq([])
      end

      it 'disconnects all integrations on multiple comps' do
        competition1 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected)
        competition2 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :stripe_connected, id: "TestComp1")
        competition3 = FactoryBot.create(:competition, :payment_disconnect_delay_elapsed, :paypal_connected, id: "TestComp2")

        described_class.perform_now
        expect(competition1.competition_payment_integrations).to eq([])
        expect(competition2.competition_payment_integrations).to eq([])
        expect(competition3.competition_payment_integrations).to eq([])
      end
    end
  end
end
