# frozen_string_literal: true

class StripePaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :stripe_transaction
  belongs_to :user
  belongs_to :confirmed_by, polymorphic: true, optional: true
  belongs_to :canceled_by, polymorphic: true, optional: true

  scope :pending, -> { where(confirmed_at: nil, canceled_at: nil) }
  scope :started, -> { joins(:stripe_transaction).where.not(stripe_transaction: { status: 'requires_payment_method' }) }
  scope :processing, -> { started.merge(pending) }

  delegate :stripe_id, :status, :parameters, :money_amount, to: :stripe_transaction

  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  serialize :error_details, JSON

  def pending?
    self.confirmed_at.nil? && self.canceled_at.nil?
  end

  def started?
    self.status != "requires_payment_method"
  end

  def retrieve_intent
    Stripe::PaymentIntent.retrieve(
      stripe_transaction.stripe_id,
      client_secret: client_secret,
      stripe_account: stripe_transaction.find_account_id,
    )
  end

  def update_status_and_charges(api_intent, action_source)
    ActiveRecord::Base.transaction do
      self.stripe_transaction.update_status(api_intent)
      self.update!(error_details: api_intent.last_payment_error)

      # Payment Intent lifecycle as per https://stripe.com/docs/payments/intents#intent-statuses
      case api_intent.status
      when 'succeeded'
        # The payment didn't need any additional actions and is completed!

        # Record the success timestamp if not already done
        self.update!(confirmed_at: DateTime.current, confirmed_by: action_source) if self.pending?

        api_intent.charges.data.each do |charge|
          recorded_transaction = StripeTransaction.find_by(stripe_id: charge.id)

          if recorded_transaction.present?
            recorded_transaction.update_status(charge)
          else
            fresh_transaction = StripeTransaction.create_from_api(charge, {})
            fresh_transaction.update!(parent_transaction: self.stripe_transaction)

            yield fresh_transaction if block_given?
          end
        end
      when 'canceled'
        # Canceled by Stripe

        self.update!(canceled_at: DateTime.current, canceled_by: action_source)
      when 'requires_payment_method'
        # Reset by Stripe

        self.update!(
          confirmed_at: nil,
          confirmed_by: nil,
          canceled_at: nil,
          canceled_by: nil,
        )
      end
    end
  end
end
