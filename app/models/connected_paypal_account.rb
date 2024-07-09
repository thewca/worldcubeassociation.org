# frozen_string_literal: true

class ConnectedPaypalAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  # TODO: Do we want to recycle Order items in PayPal the same way we recycle PaymentIntent items in Stripe?
  def prepare_intent(registration, amount_iso, currency_iso, paying_user)
    req_payload, raw_order = PaypalInterface.create_order(self.paypal_merchant_id, amount_iso, currency_iso)

    paypal_record = PaypalRecord.create_from_api(
      raw_order,
      :paypal_order,
      req_payload,
      self.paypal_merchant_id,
    )

    # memoize the payment intent in our DB because payments are handled asynchronously
    # so we need to be able to retrieve this later at any time, even when our server crashes in the meantime…
    PaymentIntent.create!(
      holder: registration,
      payment_record: paypal_record,
      client_secret: paypal_record.paypal_id,
      initiated_by: paying_user,
      wca_status: paypal_record.determine_wca_status,
    )
  end

  def retrieve_payments(payment_intent)
    captured_order = PaypalInterface.retrieve_order(self.paypal_merchant_id, payment_intent.payment_record.paypal_id)
    raw_captures = captured_order['purchase_units'].first['payments']['captures']

    raw_captures.map do |capture|
      paypal_record = PaypalRecord.find_by(paypal_id: capture['id'])

      if paypal_record.present?
        paypal_record.update_status(capture)
      else
        paypal_record = PaypalRecord.create_from_api(
          capture,
          :capture,
          {},
          self.paypal_merchant_id,
          payment_intent.payment_record,
        )

        yield paypal_record if block_given?
      end

      paypal_record
    end
  end

  def find_payment(record_id)
    PaypalRecord.capture.find(record_id)
  end

  def find_payment_from_request(params)
    order_id = params.require(:order_id)
    stored_record = PaypalRecord.find_by(paypal_id: order_id)

    raise t("registrations.payment_form.errors.paypal.not_an_order") unless stored_record&.paypal_order?

    stored_record
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
