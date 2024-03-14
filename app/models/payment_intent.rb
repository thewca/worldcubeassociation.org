# frozen_string_literal: true

# feeling cute might delete later

class PaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :payment_record, polymorphic: true
  belongs_to :initiated_by, class_name: 'User'
  belongs_to :confirmation_source, polymorphic: true, optional: true # TODO: Rename this to something like "confirmation_source" || this is about where the confirmation came from
  belongs_to :cancellation_source, polymorphic: true, optional: true # TODO: Rename this to something like "confirmation_source" || this is about where the confirmation came from

  scope :pending, -> { where(confirmed_at: nil, canceled_at: nil) }
  scope :started, -> { joins(:payment_record).where.not(payment_record: { status: 'requires_payment_method' }) }
  scope :processing, -> { started.merge(pending) }

  # TODO: Refactor this or move it into this class
  delegate :stripe_id, :status, :parameters, :money_amount, :find_account_id, to: :payment_record

  # TODO: Should stripe secrets be stored here? Or on the record object?
  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  serialize :error_details, coder: JSON

  def pending?
    self.confirmed_at.nil? && self.canceled_at.nil?
  end

  def started?
    self.status != "requires_payment_method"
  end

  def retrieve_intent
    Stripe::PaymentIntent.retrieve(
      self.stripe_id,
      client_secret: client_secret,
      stripe_account: self.find_account_id,
    )
  end

  def update_status_and_charges(api_intent, action_source, source_datetime = DateTime.current)
    if payment_record_type == 'StripeRecord'
      update_stripe_status_and_charges(api_intent, action_source, source_datetime)
    elsif payment_record_type == 'PaypalRecord'
      raise 'Paypal is not enabled in production' if PaypalInterface.paypal_disabled?
    else
      raise "Trying to update status and charges for a PaymentIntent with unmatched payment_record_type of: #{payment_record_type}"
    end
  end

  def update_stripe_status_and_charges(api_intent, action_source, source_datetime = DateTime.current)
    ActiveRecord::Base.transaction do
      self.payment_record.update_status(api_intent)
      self.update!(error_details: api_intent.last_payment_error)

      # Payment Intent lifecycle as per https://stripe.com/docs/payments/intents#intent-statuses
      case api_intent.status
      when 'succeeded'
        # The payment didn't need any additional actions and is completed!

        # Record the success timestamp if not already done
        self.update!(confirmed_at: source_datetime, confirmation_source: action_source) if self.pending?

        intent_charges = Stripe::Charge.list(
          { payment_intent: self.stripe_id },
          stripe_account: self.find_account_id,
        )

        intent_charges.data.each do |charge|
          recorded_transaction = StripeRecord.find_by(stripe_id: charge.id)

          if recorded_transaction.present?
            recorded_transaction.update_status(charge)
          else
            fresh_transaction = StripeRecord.create_from_api(charge, {})
            fresh_transaction.update!(parent_transaction: self.payment_record)

            # Only trigger outer update blocks for charges that are actually successful. This is reasonable
            # because we only ever trigger this block for PIs that are marked "successful" in the first place
            charge_successful = fresh_transaction.status == "succeeded"

            yield fresh_transaction if block_given? && charge_successful
          end
        end
      when 'canceled'
        # Canceled by Stripe

        self.update!(canceled_at: source_datetime, cancellation_source: action_source)
      when 'requires_payment_method'
        # Reset by Stripe

        self.update!(
          confirmed_at: nil,
          confirmation_source: nil,
          canceled_at: nil,
          cancellation_source: nil,
        )
      end
    end
  end
end
