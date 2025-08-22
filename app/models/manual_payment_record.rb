# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
  WCA_TO_MANUAL_PAYMENT_STATUS_MAP = {
    created: %w[created],
    pending: %w[],
    processing: %w[],
    requires_capture: %w[user_submitted],
    partial: %w[],
    failed: %w[],
    succeeded: %w[organizer_approved],
    canceled: %w[],
  }.freeze

  enum :manual_status, {
    created: 'created',
    user_submitted: 'user_submitted',
    organizer_approved: 'organizer_approved',
  }

  has_one :registration_payment, as: :receipt
  has_one :payment_intent, as: :payment_record

  def determine_wca_status
    WCA_TO_MANUAL_PAYMENT_STATUS_MAP.find { |_key, values| values.include?(self.manual_status) }.first
  end

  def retrieve_remote
    self
  end

  def update_status(updated_record)
    update(payment_reference: updated_record.payment_reference, manual_status: updated_record.manual_status)
  end
end
