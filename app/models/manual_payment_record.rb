# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
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

  def ruby_amount_available_for_refund
    self.amount_iso_denomination
  end
end
