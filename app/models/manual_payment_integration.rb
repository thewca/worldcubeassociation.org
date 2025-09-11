# frozen_string_literal: true

class ManualPaymentIntegration < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def self.manual_payments_disabled?
    Rails.env.production? && EnvConfig.WCA_LIVE_SITE?
  end

  def find_payment(record_id)
    ManualPaymentRecord.find(record_id)
  end

  def find_payment_from_request(params)
    # The client secret is just the id of the database model, but we override the payment_reference
    # from the new one, so we can update it in update_status. This is simulating getting an updated version
    # from a payment provider after paying
    ManualPaymentRecord.find(params[:client_secret]).tap do |mpr|
      mpr.payment_reference = params[:payment_reference_label]
      mpr.manual_status = ManualPaymentRecord.manual_statuses[:user_submitted]
    end
  end

  def retrieve_payments(payment_intent)
    yield payment_intent.payment_record
  end

  def self.generate_onboarding_link(competition_id)
    return nil if self.manual_payments_disabled?

    Rails.application.routes.url_helpers.competition_manual_payment_setup_url(competition_id)
  end

  def account_details
    serializable_hash(only: %i[payment_instructions payment_reference_label])
  end

  def self.connect_integration(form_params)
    model_attributes = form_params.permit(:payment_instructions, :payment_reference_label)

    # We need to pipe the `payment_information` field through Markdown, because otherwise line breaks are lost :(
    model_attributes[:payment_instructions] = Base64.decode64(form_params[:payment_instructions].to_s).force_encoding("UTF-8")

    ManualPaymentIntegration.new(model_attributes)
  end
end
