# frozen_string_literal: true

# TODO: Add validation to ensure that multiple accounts of the same type don't get added to CompetitionPaymentIntegration
class CompetitionPaymentIntegration < ApplicationRecord
  belongs_to :connected_account, polymorphic: true

  belongs_to :competition

  AVAILABLE_INTEGRATIONS = {
    paypal: 'ConnectedPaypalAccount',
    stripe: 'ConnectedStripeAccount',
  }.freeze

  INTEGRATION_DASHBOARD_URLS = {
    paypal: "https://www.paypal.com/listing/customers",
    stripe: "https://dashboard.stripe.com/account/applications",
  }.freeze

  INTEGRATION_CURRENCY_INFORMATION = {
    paypal: "https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/",
    stripe: "https://docs.stripe.com/currencies#supportedcurrencies",
  }.freeze

  INTEGRATION_RECORD_TYPES = {
    paypal: 'PaypalRecord',
    stripe: 'StripeRecord',
  }.freeze

  scope :paypal, -> { where(connected_account_type: AVAILABLE_INTEGRATIONS[:paypal]) }
  scope :stripe, -> { where(connected_account_type: AVAILABLE_INTEGRATIONS[:stripe]) }

  def self.validate_integration_name!(integration_name)
    raise ArgumentError.new("Invalid integration name. Allowed values are: #{AVAILABLE_INTEGRATIONS.keys.join(', ')}") unless
      AVAILABLE_INTEGRATIONS.key?(integration_name)
  end

  # We mark an account as inactive if a payment provider informs us that we no longer have access to that account
  # In this case, the expected workflow is:
  # 1. Inform the organizer via UI that the account is inactive, and ask them to remove the connected payment integration
  # 2. Organizer removes CPI and connects a new account
  # Thus "inactive" is a placeholder state before a CPI is removed - which is why we have no mark_active functionality
  def mark_inactive
    self.update(active: false)
  end
end
