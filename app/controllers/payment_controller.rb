# frozen_string_literal: true

class PaymentController < ApplicationController
  def payment_config
    if current_user
      payment_id = params.require(:payment_id)
      competition_id = params.require(:competition_id)

      competition = Competition.find(competition_id)
      return render status: :bad_request, json: { error: "Competition doesn't use new Registration Service" } unless competition.uses_new_registration_service?

      payment_intent = PaymentIntent.find(payment_id)
      secret = payment_intent.client_secret
      render json: { stripe_publishable_key: AppSecrets.STRIPE_PUBLISHABLE_KEY,
                     connected_account_id: competition.payment_account_for(:stripe).account_id,
                     client_secret: secret }
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end

  def payment_finish
    if current_user
      attendee_id = params.require(:attendee_id)
      competition_id, user_id = attendee_id.split("-")

      return redirect_to Microservices::Registrations.competition_register_path(competition_id, "not_authorized") unless user_id == current_user.id

      ms_registration = MicroserviceRegistration.find_by(competition_id: competition_id, user_id: user_id)
      return redirect_to Microservices::Registrations.competition_register_path(competition_id, "payment_not_found") unless ms_registration.present?

      # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
      intent_id = params[:payment_intent]
      intent_secret = params[:payment_intent_client_secret]

      stored_stripe_record = StripeRecord.find_by(stripe_id: intent_id)
      payment_intent = stored_stripe_record.payment_intent

      return redirect_to Microservices::Registrations.competition_register_path(competition_id, "not_authorized") unless payment_intent.holder == ms_registration
      return redirect_to Microservices::Registrations.competition_register_path(competition_id, "secret_invalid") unless payment_intent.client_secret == intent_secret

      # No need to create a new intent here. We can just query the stored intent from Stripe directly.
      stripe_intent = payment_intent.retrieve_remote

      return redirect_to Microservices::Registrations.competition_register_path(competition_id, "intent_not_found") unless stripe_intent.present?

      payment_intent.update_status_and_charges(stripe_intent, current_user) do |charge|
        ruby_money = charge.money_amount

        begin
          Microservices::Registrations.update_registration_payment(attendee_id, charge.id, ruby_money.cents, ruby_money.currency.iso_code, stripe_intent.status)
        rescue Faraday::Error
          return redirect_to Microservices::Registrations.competition_register_path(competition_id, "registration_unreachable")
        end
      end

      redirect_to Microservices::Registrations.competition_register_path(competition_id, stored_stripe_record.status)
    else
      redirect_to user_session_path
    end
  end

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

  def payment_refund
    payment_id = params.require(:payment_id)

    attendee_id = params.require(:attendee_id)
    competition_id, user_id = attendee_id.split("-")

    ms_registration = MicroserviceRegistration.includes(:competition)
                                              .find_by(competition_id: competition_id, user_id: user_id)
    return render status: :bad_request, json: { error: "Registration not found" } unless ms_registration.present?

    competition = ms_registration.competition
    return render status: :unauthorized, json: { error: 'unauthorized' } unless current_user.can_manage_competition?(competition)

    stripe_integration = competition.payment_account_for(:stripe)
    return render json: { error: "no_stripe" } unless stripe_integration.present?

    charge = StripeRecord.charge.find(payment_id)
    return render json: { error: "invalid_transaction" } unless charge.present?

    intent = charge.root_record.payment_intent
    return render json: { error: "invalid_transaction" } unless intent.holder == ms_registration

    refund_amount_param = params.require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    return render json: { error: "refund_zero" } if refund_amount < 0

    refund_receipt = stripe_integration.issue_refund(charge.stripe_id, refund_amount)

    currency_iso = refund_receipt.currency_code

    begin
      Microservices::Registrations.update_registration_payment(attendee_id, refund_receipt.id, refund_amount, currency_iso, "refund")
    rescue Faraday::Error
      return render json: { error: "registration_unreachable" }
    end

    render json: { status: "ok" }
  end
end
