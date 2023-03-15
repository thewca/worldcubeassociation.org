# frozen_string_literal: true

class StripeWebhookEvent < ApplicationRecord
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded'
  PAYMENT_INTENT_CANCELED = 'payment_intent.canceled'

  HANDLED_EVENTS = [
    PAYMENT_INTENT_SUCCEEDED,
    PAYMENT_INTENT_CANCELED,
  ].freeze

  default_scope -> { handled }

  scope :handled, -> { where(handled: true) }

  belongs_to :stripe_transaction, optional: true

  has_one :confirmed_intent, class_name: "StripePaymentIntent", as: :confirmed_by
  has_one :canceled_intent, class_name: "StripePaymentIntent", as: :canceled_by

  def retrieve_event
    Stripe::Event.retrieve(self.stripe_id, stripe_account: self.account_id)
  end

  def self.create_from_api(api_event, handled: false)
    StripeWebhookEvent.create!(
      stripe_id: api_event.id,
      event_type: api_event.type,
      account_id: api_event.account,
      handled: handled,
    )
  end
end
