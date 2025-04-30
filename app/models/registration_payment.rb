# frozen_string_literal: true

class RegistrationPayment < ApplicationRecord
  belongs_to :registration
  belongs_to :user

  belongs_to :receipt, polymorphic: true, optional: true

  belongs_to :refunded_registration_payment, class_name: 'RegistrationPayment', optional: true
  has_many :refunding_registration_payments, class_name: 'RegistrationPayment', inverse_of: :refunded_registration_payment, foreign_key: :refunded_registration_payment_id, dependent: :destroy

  after_create :auto_close_hook, unless: :refunded_registration_payment_id?

  monetize :amount_lowest_denomination,
           as: "amount",
           allow_nil: true,
           with_model_currency: :currency_code

  def amount_available_for_refund
    amount_lowest_denomination + refunding_registration_payments.sum(:amount_lowest_denomination)
  end

  def payment_status
    case receipt.stripe_record_type
    when "refund"
      "refund"
    else
      receipt.determine_wca_status
    end
  end

  def to_v2_json
    payment_provider = CompetitionPaymentIntegration::INTEGRATION_RECORD_TYPES.invert[self.receipt_type]

    available_amount = self.amount_available_for_refund
    full_amount_ruby = self.amount_lowest_denomination

    human_amount_refundable = helpers.ruby_money_to_human_readable(available_amount, self.currency_code)
    human_amount_payment = helpers.ruby_money_to_human_readable(full_amount_ruby, self.currency_code)

    {
      payment_id: self.receipt_id,
      payment_provider: payment_provider,
      ruby_amount_refundable: available_amount,
      human_amount_refundable: human_amount_refundable,
      human_amount_payment: human_amount_payment,
      currency_code: self.currency_code,
      refunding_payments: self.refunding_registration_payments,
    }
  end

  private def auto_close_hook
    registration.consider_auto_close
  end
end
