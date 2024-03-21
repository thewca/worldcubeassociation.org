# frozen_string_literal: true

class PaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :payment_record, polymorphic: true
  belongs_to :initiated_by, class_name: 'User' # For now only users can initiate payments - in future, this may become a polymorphic association
  belongs_to :confirmation_source, polymorphic: true, optional: true
  belongs_to :cancellation_source, polymorphic: true, optional: true

  validate :valid_status_combination

  scope :pending, -> { where(wca_status: :pending) }
  scope :started, -> { where.not(wca_status: [:created]) }

  # TODO: Refactor this or move it into this class
  delegate :stripe_id, :stripe_status, :parameters, :money_amount, :find_account_id, to: :payment_record

  # TODO: Should stripe secrets be stored here? Or on the record object?
  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  serialize :error_details, coder: JSON

  enum wca_status: {
    created: 'created', # A record has been created on the payment provider's system (no payment action yet initiated by the user)
    pending: 'pending', # The user is now attempting to pay, but has not reached a completion state yet
    partial: 'partial', # Some but not all funds have been paid (eg, if the user has selected an instalment-based payment option)
    failed: 'failed', # The payment did not succeed for any reason (insufficient funds, user error) but the user can still try to pay
    succeeded: 'succeeded', # Completion state - The full amount due is confirmed as being paid by the payment provider
    canceled: 'canceled', # Completion state - the user has indicated that they will no longer attempt to complete payment
  }

  def self.started_records
    started_stripe_records = StripeRecord.started
    started_intents = []

    started_stripe_records.find_each do |record|
      started_intents << record.payment_intent
    end

    started_intents
  end

  def retrieve_intent
    Stripe::PaymentIntent.retrieve(
      self.stripe_id,
      client_secret: client_secret,
      stripe_account: self.find_account_id,
    )
  end

  def update_status_and_charges(api_intent, action_source, source_datetime = DateTime.current, &block)
    if payment_record_type == 'StripeRecord'
      update_stripe_status_and_charges(api_intent, action_source, source_datetime, &block)
    elsif payment_record_type == 'PaypalRecord'
      raise 'Paypal is not enabled in production' if PaypalInterface.paypal_disabled?
    else
      raise "Trying to update status and charges for a PaymentIntent with unmatched payment_record_type of: #{payment_record_type}"
    end
  end

  def update_stripe_status_and_charges(api_intent, action_source, source_datetime)
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
            charge_successful = fresh_transaction.stripe_status == "succeeded"

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

  # Sets the wca_status field based on the status field of the associated PaymentRecord
  def set_wca_status
    self.wca_status = payment_record.determine_wca_status
  end

  private

    def valid_status_combination
      if payment_record_type == 'StripeRecord'
        errors.add(:wca_status, "is not compatible with StripeRecord status: #{payment_record.stripe_status}") unless
          StripeRecord::WCA_TO_STRIPE_STATUS_MAP[wca_status.to_sym].include?(payment_record.stripe_status)
      elsif payment_record_type == 'PaypalRecord'
        raise 'Paypal is not enabled in production' if PaypalInterface.paypal_disabled?
      else
        raise "No status combination validation defined for: #{payment_record_type}"
      end
    end
end
