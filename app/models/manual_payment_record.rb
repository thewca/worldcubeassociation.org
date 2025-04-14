# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
  WCA_TO_MANUAL_PAYMENT_STATUS_MAP = {
    created: %w[created],
    succeeded: %w[succeeded],
  }.freeze

  has_one :registration_payment, as: :receipt
  has_one :payment_intent, as: :payment_record

  def determine_wca_status
    payment_reference.present? ? "succeeded" : "created"
  end

  def retrieve_remote
    self
  end

  def money_amount
    Money.new(self.amount_iso_denomination, self.currency_code)
  end

  def update_status(updated_record)
    update(payment_reference: updated_record.payment_reference)
  end

  def ruby_amount_available_for_refund
    self.amount_iso_denomination
  end

  def status
    payment_reference.present? ? "succeeded" : "created"
  end
end
