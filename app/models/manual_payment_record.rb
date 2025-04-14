# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
  has_one :registration_payment, as: :receipt
  has_one :payment_intent, as: :payment_record

  validates :payment_reference, presence: true

  def determine_wca_status
    "succeeded"
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
