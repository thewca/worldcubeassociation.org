# frozen_string_literal: true

class ConnectedPaypalAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def self.generate_onboarding_link(competition_id)
    return nil if PaypalInterface.paypal_disabled? || Rails.env.test?

    PaypalInterface.generate_paypal_onboarding_link(competition_id)
  end

  def self.connect_account(oauth_return_params)
    ConnectedPaypalAccount.new(
      paypal_merchant_id: oauth_return_params[:merchantIdInPayPal],
      permissions_granted: oauth_return_params[:permissionsGranted],
      account_status: oauth_return_params[:accountStatus],
      consent_status: oauth_return_params[:consentStatus],
    )
  end
end
