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
end
