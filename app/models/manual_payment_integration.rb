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
      client_secret: 'manual',
      initiated_by: paying_user,
      wca_status: stripe_record.determine_wca_status,
      )
  end

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

  def connect_integration(params)
    ManualPaymentIntegration.create(payment_information: params[:payment_info], payment_reference: params[:payment_reference])
  end

  def dashboard
  end
end
