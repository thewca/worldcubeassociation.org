# frozen_string_literal: true

class RegistrationPayment < ApplicationRecord
  belongs_to :registration
  belongs_to :user

  belongs_to :receipt, polymorphic: true, optional: true

  belongs_to :refunded_registration_payment, class_name: 'RegistrationPayment', optional: true
  has_many :refunding_registration_payments, class_name: 'RegistrationPayment', inverse_of: :refunded_registration_payment, foreign_key: :refunded_registration_payment_id, dependent: :destroy

  delegate :auto_accept_in_current_env?, :auto_accept_registrations, to: :registration
  after_create :auto_accept_hook, if: %i[auto_accept_in_current_env? auto_accept_registrations]
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

  private def auto_accept_hook
    registration.attempt_auto_accept
  end

  private def auto_close_hook
    registration.consider_auto_close
  end

  def to_v2_json(refunds: false)
    payment_provider = CompetitionPaymentIntegration::INTEGRATION_RECORD_TYPES.key(self.receipt_type)

    v2_json = {
      user_id: self.user_id,
      payment_id: self.receipt_id,
      payment_provider: payment_provider,
      iso_amount_payment: self.amount_lowest_denomination.abs,
      currency_code: self.currency_code,
    }

    if refunds
      available_amount = self.amount_available_for_refund

      # refunds don't have their own nested refunds, so we can safely hard-code `false` here
      refunding_payments_json = self.refunding_registration_payments.map { it.to_v2_json(refunds: false) }

      v2_json.deep_merge!({
                            iso_amount_refundable: available_amount,
                            refunding_payments: refunding_payments_json,
                          })
    end

    v2_json
  end
end
