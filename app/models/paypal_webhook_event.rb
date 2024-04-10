# frozen_string_literal: true

class PaypalWebhookEvent < ApplicationRecord
  # TODO: From the documentation itself it is not _entirely_ clear whether we should take .APPROVED or .COMPLETED here
  #   Both events exist, but from the vague description it is not exactly clear which is which.
  CHECKOUT_ORDER_APPROVED = 'CHECKOUT.ORDER.APPROVED'
  CHECKOUT_PAYMENT_APPROVAL_REVERSED = 'CHECKOUT.PAYMENT-APPROVAL.REVERSED'

  HANDLED_EVENTS = [
    CHECKOUT_ORDER_APPROVED,
    CHECKOUT_PAYMENT_APPROVAL_REVERSED,
  ].freeze

  default_scope -> { handled }

  scope :handled, -> { where(handled: true) }

  belongs_to :stripe_record, optional: true

  has_one :confirmed_intent, class_name: "PaymentIntent", as: :confirmation_source
  has_one :canceled_intent, class_name: "PaymentIntent", as: :cancellation_source

  # We don't need the native JSON type on DB level, so we serialize in Ruby.
  # Also saves us from some pains because JSON columns are highly inconsistent among MySQL and MariaDB.
  serialize :paypal_headers, coder: JSON

  def retrieve_event
    PaypalInterface.retrieve_webhook_event(self.merchant_id, self.paypal_id)
  end

  def self.create_from_api(api_event, paypal_headers, handled: false)
    # TODO: Use parser method from other PR
    created_at_remote = DateTime.parse(api_event['create_time']).to_datetime

    PaypalWebhookEvent.create!(
      paypal_id: api_event['id'],
      event_type: api_event['event_type'],
      event_version: api_event['event_version'],
      created_at_remote: created_at_remote,
      paypal_headers: paypal_headers,
      handled: handled,
    )
  end
end
