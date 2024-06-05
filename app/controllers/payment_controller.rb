# frozen_string_literal: true

class PaymentController < ApplicationController
  def available_refunds
    if current_user
      attendee_id = params.require(:attendee_id)
      competition_id, user_id = attendee_id.split("-")

      ms_registration = MicroserviceRegistration.includes(:competition, :payment_intents)
                                                .find_by(competition_id: competition_id, user_id: user_id)
      return render status: :bad_request, json: { error: "Registration not found" } unless ms_registration.present?

      competition = ms_registration.competition
      return render status: :unauthorized, json: { error: 'unauthorized' } unless current_user.can_manage_competition?(competition)

      intents = ms_registration.payment_intents

      charges = intents.flat_map { |intent|
        intent.payment_record.child_records.charge.map { |record|
          available_amount = record.ruby_amount_available_for_refund

          ruby_amount_refundable = StripeRecord.amount_to_ruby(available_amount, record.currency_code)
          human_amount_refundable = helpers.stripe_to_human_readable(available_amount, record.currency_code)
          human_amount_payment = helpers.stripe_to_human_readable(paid_amount, record.currency_code)

          {
            payment_id: record.id,
            full_amount: paid_amount,
            ruby_amount_refundable: ruby_amount_refundable,
            human_amount_refundable: human_amount_refundable,
            human_amount_payment: human_amount_payment,
            currency_code: record.currency_code,
          }
        }
      }

      render json: { charges: charges }, status: :ok
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end
end
