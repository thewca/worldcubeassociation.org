# frozen_string_literal: true

class StripePaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :stripe_transaction
  belongs_to :user

  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  def retrieve_intent
    Stripe::PaymentIntent.retrieve(
      stripe_transaction.stripe_id,
      client_secret: client_secret,
      stripe_account: stripe_transaction.find_account_id,
    )
  end
end
