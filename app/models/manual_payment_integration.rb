# frozen_string_literal: true

class ManualPaymentIntegration < ApplicationRecord
  def find_payment(record_id)
    ManualPaymentRecord.find(record_id)
  end

  def self.generate_onboarding_link(competition_id)
    Rails.application.routes.url_helpers.competition_manual_payment_setup_url(competition_id)
  end
end
