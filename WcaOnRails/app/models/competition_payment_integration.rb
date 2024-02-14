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

  def self.paypal_connected?(competition)
    competition.competition_payment_integrations.paypal.exists?
  end

  def self.stripe_connected?(competition)
    competition.competition_payment_integrations.stripe.exists?
  end

  # TODO: Add tests for case where integration isn't found
  def self.disconnect(competition, integration_name)
    validate_integration_name!(integration_name)
    competition.competition_payment_integrations.destroy_by(connected_account_type: AVAILABLE_INTEGRATIONS[integration_name])
  end

  def self.disconnect_all(competition)
    competition.competition_payment_integrations.destroy_all
  end

  def set_as_inactive
    self.integration_active = false
    save
  end

  private_class_method def self.validate_integration_name!(integration_name)
    raise ArgumentError.new("Invalid integration name. Allowed values are: #{AVAILABLE_INTEGRATIONS.keys.join(', ')}") unless
      AVAILABLE_INTEGRATIONS.keys.include?(integration_name)
  end
end
