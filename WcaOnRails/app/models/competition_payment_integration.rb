# frozen_string_literal: true

class CompetitionPaymentIntegration < ApplicationRecord
  belongs_to :connected_account, polymorphic: true

  belongs_to :competition

  # enum connected_account_type: {
  #   'paypal' => 'ConnectedPaypalAccount',
  # }

  def self.paypal_connected?(competition)
    competition.competition_payment_integrations.paypal.exists?
  end

  # TODO: Add tests for case where integration isn't found
  def self.disconnect(competition, integration_name)
    raise ArgumentError("Invalid status. Allowed values are: #{connected_account_types.keys.join(', ')}") unless
      connected_account_types.keys.include?(integration_name)

    competition.competition_payment_integrations.destory_by(connected_account_type: integration_name)
  end
end
