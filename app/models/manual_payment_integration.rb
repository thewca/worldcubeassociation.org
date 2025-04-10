# frozen_string_literal: true

class ManualPaymentIntegration < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account
  def find_payment(record_id)
    ManualPaymentRecord.find(record_id)
  end

  def self.generate_onboarding_link(competition_id)
    Rails.application.routes.url_helpers.competition_manual_payment_setup_url(competition_id)
  end

  def account_details
    {
      payment_info: payment_information,
      payment_reference: payment_reference,
    }
  end

  def dashboard

  end
end
