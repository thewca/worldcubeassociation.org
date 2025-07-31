# frozen_string_literal: true

class PaymentIntent < ApplicationRecord
  belongs_to :holder, polymorphic: true
  belongs_to :payment_record, polymorphic: true
  belongs_to :initiated_by, class_name: 'User' # For now only users can initiate payments - in future, this may become a polymorphic association
  belongs_to :confirmation_source, polymorphic: true, optional: true
  belongs_to :cancellation_source, polymorphic: true, optional: true

  validate :wca_status_consistency

  scope :started, -> { where.not(wca_status: 'created') }
  scope :incomplete, -> { where.not(wca_status: %w[succeeded canceled]) }

  delegate :retrieve_remote, :money_amount, :account_id, :determine_wca_status, to: :payment_record

  # Stripe secrets are case-sensitive. Make sure that this information is not lost during encryption.
  encrypts :client_secret, downcase: false

  serialize :error_details, coder: JSON

  enum :wca_status, {
    created: 'created', # A record has been created on the payment provider's system (no payment action yet initiated by the user)
    pending: 'pending', # The user is now attempting to pay, but has not reached a completion state yet
    requires_capture: 'requires_capture', # The user has confirmed their payment details and payment approval - the payee must now capture the payment
    partial: 'partial', # Some but not all funds have been paid (eg, if the user has selected an instalment-based payment option)
    processing: 'processing', # The payment is in progress, but the user cannot do anything to advance its state (eg, provider waiting for outcome of bank transfer)
    failed: 'failed', # The payment did not succeed for any reason (insufficient funds, user error) but the user can still try to pay
    succeeded: 'succeeded', # Completion state - The full amount due is confirmed as being paid by the payment provider
    canceled: 'canceled', # Completion state - the user has indicated that they will no longer attempt to complete payment
  }

  # Normally this would be a case for `enum :payment_record_type`, but Rails does not support enums on polymorphic types :/
  # See https://github.com/rails/rails/issues/17844 for reference.
  scope :paypal, -> { where(payment_record_type: 'PaypalRecord') }
  scope :stripe, -> { where(payment_record_type: 'StripeRecord') }

  def update_status_and_charges(payment_account, api_intent, action_source, source_datetime = DateTime.current)
    self.with_lock do
      # The order of operations here is critical:
      #   We need to update the underlying raw record first, so that `determine_wca_status` works correctly
      self.payment_record.update_status(api_intent)
      updated_wca_status = self.determine_wca_status.to_s

      case updated_wca_status
      when PaymentIntent.wca_statuses[:succeeded]
        # The payment didn't need any additional actions and is completed!

        # Record the success timestamp if not already done
        unless self.succeeded?
          self.update!(
            confirmed_at: source_datetime,
            confirmation_source: action_source,
            wca_status: updated_wca_status,
          )
        end

        payment_account.retrieve_payments(self) do |payment|
          # Only trigger outer update blocks for charges that are actually successful. This is reasonable
          # because we only ever trigger this block for PIs that are marked "successful" in the first place
          charge_successful = payment.determine_wca_status.to_s == PaymentIntent.wca_statuses[:succeeded]

          yield payment if block_given? && charge_successful
        end
      when PaymentIntent.wca_statuses[:canceled]
        # Canceled by the gateway

        # Record the cancellation timestamp if not already done
        unless self.canceled?
          self.update!(
            canceled_at: source_datetime,
            cancellation_source: action_source,
            wca_status: updated_wca_status,
          )
        end
      when PaymentIntent.wca_statuses[:created],
        PaymentIntent.wca_statuses[:pending]
        # Reset by the gateway
        self.update!(
          confirmed_at: nil,
          confirmation_source: nil,
          canceled_at: nil,
          cancellation_source: nil,
          wca_status: updated_wca_status,
        )
      end

      self.update_common_attributes!(api_intent, updated_wca_status)
    end
  end

  private

    def update_common_attributes!(api_intent, updated_wca_status)
      error_details = case self.payment_record_type
                      when "StripeRecord"
                        api_intent.last_payment_error
                      end

      self.update!(wca_status: updated_wca_status, error_details: error_details)
    end

    def wca_status_consistency
      # Check that payment_record's status is in sync with wca_status
      if payment_record_type == 'StripeRecord'
        errors.add(:wca_status, "#{wca_status} is not compatible with StripeRecord status: #{payment_record.stripe_status}") unless
          StripeRecord::WCA_TO_STRIPE_STATUS_MAP[wca_status.to_sym].include?(payment_record.stripe_status)
      elsif payment_record_type == 'PaypalRecord'
        errors.add(:wca_status, "#{wca_status} is not compatible with PaypalRecord status: #{payment_record.paypal_status}") unless
          PaypalRecord::WCA_TO_PAYPAL_STATUS_MAP[wca_status.to_sym].include?(payment_record.paypal_status)
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
