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
          paid_amount = record.amount_stripe_denomination
          already_refunded = record.child_records.refund.sum(:amount_stripe_denomination)

          available_amount = paid_amount - already_refunded

          {
            payment_id: record.id,
            amount: StripeRecord.amount_to_ruby(available_amount, record.currency_code),
          }
        }
      }

      render json: { charges: charges }, status: :ok
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end
end
