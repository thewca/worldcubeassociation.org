# frozen_string_literal: true

class ManualPaymentIntegration < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def self.manual_payments_disabled?
    Rails.env.production? && EnvConfig.WCA_LIVE_SITE?
  end

  def prepare_intent(registration, amount_iso, currency_iso, paying_user, payment_reference: nil)
    existing_intent = registration.manual_payment_intent
    if existing_intent.present?
      reference_to_write = payment_reference.present? ? payment_reference : existing_intent.payment_record.payment_reference
      existing_intent.payment_record.update(amount_iso_denomination: amount_iso, currency_code: currency_iso, payment_reference: reference_to_write)
      return existing_intent
    end

    self.create_intent(registration, amount_iso, currency_iso, paying_user, payment_reference: payment_reference)
  end

  private def create_intent(registration, amount_iso, currency_iso, paying_user, payment_reference: nil)
    manual_record = ManualPaymentRecord.create(
      amount_iso_denomination: amount_iso,
      currency_code: currency_iso,
      manual_status: payment_reference.present? ? :user_submitted : :created,
      payment_reference: payment_reference
    )
    # We create a registration payment with the payment ticket instead of upon payment completion
    # so that organizers can mark a registrant as paid even if the registrant hasn't submitted a payment reference yet
    # registration.registration_payments.create!(
    #   amount_lowest_denomination: amount_iso,
    #   currency_code: currency_iso,
    #   receipt: manual_record,
    #   user: paying_user,
    #   is_completed: false,
    # )

    PaymentIntent.create!(
      holder: registration,
      initiated_by: paying_user,
      client_secret: manual_record.id,
      wca_status: manual_record.determine_wca_status,
      payment_record: manual_record
    )
  end

  def find_payment(record_id)
    ManualPaymentRecord.find(record_id)
  end

  def find_payment_intent_from_request(params)
    # Because there is no outgoing request to a payment provider, we did not create a PaymentIntent during the payment_ticket step
    # Thus, we need to create the PaymentIntent and associated PaymentRecord now instead

    registration = Registration.find(params[:registration_id])
    entry_fee = registration.competition.base_entry_fee_lowest_denomination
    currency_code = registration.competition.currency_code
    user = registration.user

    prepare_intent(registration, entry_fee, currency_code, user, payment_reference: params[:payment_reference])
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
