# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionPaymentIntegration do
  describe '#mark_inactive' do
    let!(:competition) { create(:competition, :stripe_connected) }
    let(:integration) { competition.competition_payment_integrations.first }

    it 'sets to inactive in the database' do
      integration.mark_inactive!
      expect(integration.is_inactive?).to be(true)
    end
  end
end
