# frozen_string_literal: true

class ManualPaymentIntegration < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def prepare_intent(registration, amount_iso, currency_iso, paying_user)
    existing_intent = registration.payment_intents.first
    if existing_intent.present?
      existing_intent.payment_record.update(amount_iso_denomination: amount_iso, currency_code: currency_iso)
      return existing_intent
    end

    self.create_intent(registration, amount_iso, currency_iso, paying_user)
  end

  private def create_intent(registration, amount_iso, currency_iso, paying_user)
    manual_record = ManualPaymentRecord.create(amount_iso_denomination: amount_iso, currency_code: currency_iso)

    PaymentIntent.create!(
      holder: registration,
      payment_record: manual_record,
      client_secret: manual_record.id,
      initiated_by: paying_user,
      wca_status: manual_record.determine_wca_status,
    )
  end

  def find_payment(record_id)
    ManualPaymentRecord.find(record_id)
  end

  def find_payment_from_request(params)
    # The client secret is just the id of the database model, but we override the payment_reference
    # from the new one, so we can update it in update_status. This is simulating getting an updated version
    # from a payment provider after paying
    ManualPaymentRecord.find(params[:client_secret]).tap do |mpr|
      mpr.payment_reference = params[:payment_reference]
    end
  end

  def retrieve_payments(payment_intent)
    yield payment_intent.payment_record
  end

  def self.generate_onboarding_link(competition_id)
    Rails.application.routes.url_helpers.competition_manual_payment_setup_url(competition_id)
  end

  def account_details
    serializable_hash(only: %i[payment_information payment_reference])
  end

  def self.connect_integration(form_params)
    model_attributes = form_params.permit(:payment_information, :payment_reference)

    # We need to pipe the `payment_information` field through Markdown, because otherwise line breaks are lost :(
    model_attributes[:payment_information] = Base64.decode64(form_params[:payment_information].to_s).force_encoding("UTF-8")

    ManualPaymentIntegration.new(model_attributes)
  end
end
