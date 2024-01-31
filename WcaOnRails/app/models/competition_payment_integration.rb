# frozen_string_literal: true

class CompetitionPaymentIntegration < ApplicationRecord
  belongs_to :connected_account, polymorphic: true

  belongs_to :competition

  # Refactor this to an integration_mapping
  INTEGRATION_NAMES = ['paypal'].freeze

  def self.paypal_connected?(competition)
    competition.competition_payment_integrations.exists?(connected_account_type: 'ConnectedPaypalAccount')
  end

  # TODO: Add tests for case where integration isn't found
  def self.disconnect(competition, integration_name)
    raise ArgumentError("Invalid status. Allowed values are: #{INTEGRATION_NAMES.join(', ')}") unless INTEGRATION_NAMES.include?(integration_name)

    if integration_name == 'paypal'
      integration = competition.competition_payment_integrations.find_by(connected_account_type: 'ConnectedPaypalAccount')
      connected_account = integration.connected_account
      connected_account.destroy if connected_account
    end

    integration.destroy if integration
  end
end
