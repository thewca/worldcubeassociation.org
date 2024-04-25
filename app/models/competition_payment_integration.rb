# frozen_string_literal: true

# TODO: Add validation to ensure that multiple accounts of the same type don't get added to CompetitionPaymentIntegration
class CompetitionPaymentIntegration < ApplicationRecord
  belongs_to :connected_account, polymorphic: true

  belongs_to :competition

  AVAILABLE_INTEGRATIONS = {
    paypal: 'ConnectedPaypalAccount',
    stripe: 'ConnectedStripeAccount',
  }.freeze

  scope :paypal, -> { where(connected_account_type: AVAILABLE_INTEGRATIONS[:paypal]) }
  scope :stripe, -> { where(connected_account_type: AVAILABLE_INTEGRATIONS[:stripe]) }

  def self.validate_integration_name!(integration_name)
    raise ArgumentError.new("Invalid integration name. Allowed values are: #{AVAILABLE_INTEGRATIONS.keys.join(', ')}") unless
      AVAILABLE_INTEGRATIONS.keys.include?(integration_name)
  end
end
