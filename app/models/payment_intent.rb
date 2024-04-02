# frozen_string_literal: true

class PaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :payment_record, polymorphic: true
  belongs_to :initiated_by, class_name: 'User' # For now only users can initiate payments - in future, this may become a polymorphic association
  belongs_to :confirmation_source, polymorphic: true, optional: true
  belongs_to :cancellation_source, polymorphic: true, optional: true

  validate :wca_status_consistency

  scope :started, -> { where.not(wca_status: 'created') }
  scope :incomplete, -> { where.not(wca_status: ['succeeded', 'canceled']) }

  # TODO: Refactor this or move it into this class
  delegate :stripe_id, :stripe_status, :parameters, :money_amount, :find_account_id, to: :payment_record

  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  serialize :error_details, coder: JSON

  enum wca_status: {
    created: 'created', # A record has been created on the payment provider's system (no payment action yet initiated by the user)
    pending: 'pending', # The user is now attempting to pay, but has not reached a completion state yet
    partial: 'partial', # Some but not all funds have been paid (eg, if the user has selected an instalment-based payment option)
    processing: 'processing', # The payment is in progress, but the user cannot do anything to advance its state (eg, provider waiting for outcome of bank transfer)
    failed: 'failed', # The payment did not succeed for any reason (insufficient funds, user error) but the user can still try to pay
    succeeded: 'succeeded', # Completion state - The full amount due is confirmed as being paid by the payment provider
    canceled: 'canceled', # Completion state - the user has indicated that they will no longer attempt to complete payment
  }

  def started?
    self.wca_status != 'created'
  end

  def retrieve_intent
    if payment_record_type == 'StripeRecord'
      Stripe::PaymentIntent.retrieve(
        self.stripe_id,
        client_secret: client_secret,
        stripe_account: self.find_account_id,
      )
    else
      raise "Trying to call retrieve_intent for a PaymentIntent with unmatched payment_record_type of: #{payment_record_type}"
    end
  end

  def update_status_and_charges(api_intent, action_source, source_datetime = DateTime.current, &block)
    if payment_record_type == 'StripeRecord'
      update_stripe_status_and_charges(api_intent, action_source, source_datetime, &block)
    else
      raise "Trying to update status and charges for a PaymentIntent with unmatched payment_record_type of: #{payment_record_type}"
    end
  end

  def update_stripe_status_and_charges(api_intent, action_source, source_datetime)
    ActiveRecord::Base.transaction do
      self.update!(error_details: api_intent.last_payment_error)
      self.payment_record.assign_status(api_intent) # Will also update the wca_status

      # Payment Intent lifecycle as per https://stripe.com/docs/payments/intents#intent-statuses
      case api_intent.status
      when 'succeeded'
        # The payment didn't need any additional actions and is completed!

        # Record the success timestamp if not already done
        unless self.succeeded?
          self.assign_attributes(
            confirmed_at: source_datetime,
            confirmation_source: action_source,
            wca_status: payment_record.determine_wca_status,
          )
          save
          payment_record.save
        end

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
        self.update!(
          canceled_at: source_datetime,
          cancellation_source: action_source,
          wca_status: payment_record.determine_wca_status,
        )
        save
        payment_record.save
      when 'requires_payment_method'
        # Reset by Stripe
        self.update!(
          confirmed_at: nil,
          confirmation_source: nil,
          canceled_at: nil,
          cancellation_source: nil,
          wca_status: payment_record.determine_wca_status,
        )
        save
        payment_record.save
      else
        self.update!(wca_status: payment_record.determine_wca_status)
        save
        payment_record.save
      end
    end
  end

  # Sets the wca_status field based on the status field of the associated PaymentRecord
  def assign_wca_status
    self.wca_status = payment_record.determine_wca_status
  end

  private

    def wca_status_consistency
      # Check that payment_record's status is in sync with wca_status
      if payment_record_type == 'StripeRecord'
        errors.add(:wca_status, "#{wca_status} is not compatible with StripeRecord status: #{payment_record.stripe_status}") unless
          StripeRecord::WCA_TO_STRIPE_STATUS_MAP[wca_status.to_sym].include?(payment_record.stripe_status)
      else
        raise "No status combination validation defined for: #{payment_record_type}"
      end

      # Succeeded/cancelled statuses require timestamps, and vice-versa
      errors.add(:confirmed_at, "should only be non-nil if wca_status is `succeeded`") if
        confirmed_at.present? && wca_status != 'succeeded'
      errors.add(:wca_status, "can only be `succeeded` if confirmed_at is non-nil") if
        confirmed_at.nil? && wca_status == 'succeeded'
      errors.add(:canceled_at, "should only be non-nil if wca_status is `canceled`") if
        canceled_at.present? && wca_status != 'canceled'
      errors.add(:wca_status, "can only be `canceled` if canceled_at is non-nil") if
        canceled_at.nil? && wca_status == 'canceled'
    end
end
