# frozen_string_literal: true

# TODO: Add validation to ensure that multiple accounts of the same type don't get added to CompetitionPaymentIntegration
class CompetitionPaymentIntegration < ApplicationRecord
  belongs_to :connected_account, polymorphic: true

  belongs_to :competition

  AVAILABLE_INTEGRATIONS = {
    paypal: 'ConnectedPaypalAccount',
  }.freeze

  scope :paypal, -> { where(connected_account_type: AVAILABLE_INTEGRATIONS[:paypal]) }

  def self.paypal_connected?(competition)
    competition.competition_payment_integrations.paypal.exists?
  end

  # TODO: Add tests for case where integration isn't found
  def self.disconnect(competition, integration_name)
    raise ArgumentError.new("Invalid status. Allowed values are: #{AVAILABLE_INTEGRATIONS.keys.join(', ')}") unless
      AVAILABLE_INTEGRATIONS.keys.include?(integration_name)

    competition.competition_payment_integrations.destroy_by(connected_account_type: AVAILABLE_INTEGRATIONS[integration_name])
  end
end
