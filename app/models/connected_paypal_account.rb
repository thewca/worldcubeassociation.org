# frozen_string_literal: true

class ConnectedPaypalAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def find_payment(record_id)
    PaypalRecord.capture.find(record_id)
  end

  def issue_refund(capture_record, amount_iso)
    req_payload, refund = PaypalInterface.issue_refund(
      self.paypal_merchant_id,
      capture_record.paypal_id,
      amount_iso,
      capture_record.currency_code,
    )

    PaypalRecord.create_from_api(
      refund,
      :refund,
      req_payload,
      self.paypal_merchant_id,
      capture_record,
    )
  end

  def account_details
    PaypalInterface.account_details(self.paypal_merchant_id)
                   .slice("display_name", "primary_email")
  end

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
