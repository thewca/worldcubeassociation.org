# frozen_string_literal: true

class RegistrationPayment < ApplicationRecord
  belongs_to :registration
  belongs_to :user

  belongs_to :receipt, polymorphic: true, optional: true

  belongs_to :refunded_registration_payment, class_name: 'RegistrationPayment', optional: true
  has_many :refunding_registration_payments, class_name: 'RegistrationPayment', inverse_of: :refunded_registration_payment, foreign_key: :refunded_registration_payment_id, dependent: :destroy

  delegate :auto_accept_preference_live?, to: :registration
  before_save :set_paid_at, if: :becoming_completed?, unless: :paid_at?
  after_create :auto_accept_hook, if: :auto_accept_preference_live?
  after_save :auto_close_hook

  delegate :abs, to: :amount_lowest_denomination, prefix: true
  delegate :amount_available_for_refund, to: :refunded_registration_payment, prefix: :parent, allow_nil: true
  validates :amount_lowest_denomination_abs, comparison: { less_than_or_equal_to: :parent_amount_available_for_refund }, on: :create, if: :refunded_registration_payment

  scope :completed, -> { where(is_completed: true) }

  monetize :amount_lowest_denomination,
           as: "amount",
           allow_nil: true,
           with_model_currency: :currency_code

  private def becoming_completed?
    is_completed && (will_save_change_to_is_completed? || new_record?)
  end

  private def set_paid_at
    self.paid_at = current_time_from_proper_timezone
  end

  def amount_available_for_refund
    amount_lowest_denomination + refunding_registration_payments.sum(:amount_lowest_denomination)
  end

  private def auto_accept_hook
    registration.attempt_auto_accept
  end

  private def auto_close_hook
    return unless refunded_registration_payment_id.nil? && is_completed?

    registration.consider_auto_close if saved_change_to_is_completed? || previously_new_record?
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
