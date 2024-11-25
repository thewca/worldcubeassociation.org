# frozen_string_literal: true

class PaymentController < ApplicationController
  def available_refunds
    if current_user
      attendee_id = params.require(:attendee_id)
      competition_id, user_id = attendee_id.split("-")
      competition = Competition.find(competition_id)

      registration = Registration.includes(:registration_payments).find_by(competition: competition, user_id: user_id)

      return render status: :bad_request, json: { error: "Registration not found" } unless registration.present?

      return render status: :unauthorized, json: { error: 'unauthorized' } unless current_user.can_manage_competition?(competition)

      # Use `filter` here on purpose because the whole `registration_payments` list has been included above.
      #   Using `where` would create an SQL query, but it would also break (i.e. make redundant) the `includes` call above.
      root_payments = registration.registration_payments.filter { |rp| rp.refunded_registration_payment_id.nil? }

      charges = root_payments.map { |reg_payment|
        payment_provider = CompetitionPaymentIntegration::INTEGRATION_RECORD_TYPES.invert[reg_payment.receipt_type]

        available_amount = reg_payment.amount_available_for_refund
        full_amount_ruby = reg_payment.amount_lowest_denomination

        human_amount_refundable = helpers.ruby_money_to_human_readable(available_amount, reg_payment.currency_code)
        human_amount_payment = helpers.ruby_money_to_human_readable(full_amount_ruby, reg_payment.currency_code)

        {
          payment_id: reg_payment.receipt_id,
          payment_provider: payment_provider,
          ruby_amount_refundable: available_amount,
          human_amount_refundable: human_amount_refundable,
          human_amount_payment: human_amount_payment,
          currency_code: reg_payment.currency_code,
        }
      }

      render json: { charges: charges }, status: :ok
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end
end
