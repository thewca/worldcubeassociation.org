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
      # TODO: Why is this not referenced by our WCA-internal PI number?
      attendee_id = params.require(:attendee_id)
      competition_id, user_id = attendee_id.split("-")

      return redirect_to Microservices::Registrations.competition_register_path(competition, "not_authorized") unless user_id == current_user.id

      # TODO: Can we reasonably assume that the microservice already cached this particular one?
      #   (my thinking is: YES, because we fetched it upon creating the very PI we're finishing now)
      ms_registration = MicroserviceRegistration.find_by(competition_id: competition_id, user_id: user_id)

      return redirect_to Microservices::Registrations.competition_register_path(competition, "payment_not_found") unless ms_registration.present?

      competition = ms_registration.competition

      # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
      intent_id = params[:payment_intent]
      intent_secret = params[:payment_intent_client_secret]

      stored_stripe_record = StripeRecord.find_by(stripe_id: intent_id)
      payment_intent = stored_stripe_record.payment_intent

      return redirect_to Microservices::Registrations.competition_register_path(competition.id, "secret_invalid") unless payment_intent.client_secret == intent_secret

      # No need to create a new intent here. We can just query the stored intent from Stripe directly.
      stripe_intent = payment_intent.retrieve_remote

      return redirect_to Microservices::Registrations.competition_register_path(competition.id, "intent_not_found") unless stripe_intent.present?

      payment_intent.update_status_and_charges(stripe_intent, current_user) do |charge|
        ruby_money = charge.money_amount

        begin
          Microservices::Registrations.update_registration_payment(attendee_id, charge.id, ruby_money.cents, ruby_money.currency.iso_code, stripe_intent.status)
        rescue Faraday::Error
          return redirect_to Microservices::Registrations.competition_register_path(competition.id, "registration_unreachable")
        end
      end

      redirect_to Microservices::Registrations.competition_register_path(competition.id, stored_stripe_record.status)
    else
      redirect_to user_session_path
    end
  end

  def available_refunds
    if current_user
      # TODO: Why is this not referenced by our WCA-internal PI number?
      attendee_id = params.require(:attendee_id)
      competition_id, user_id = attendee_id.split("-")

      ms_registration = MicroserviceRegistration.find_by(competition_id: competition_id, user_id: user_id)
      return render status: :bad_request, json: { error: "Registration not found" } unless ms_registration.present?

      competition = ms_registration.competition
      return render status: :unauthorized, json: { error: 'unauthorized' } unless current_user.can_manage_competition?(competition)

      # FIXME: This currently breaks because there is no 1:1 association between MSReg and monolith PI
      #   To fix this, have the microservice send over the PI number instead
      intent = ms_registration.payment_intent

      charges = intent.payment_record.child_records.charge.map { |t|
        {
          payment_id: t.id,
          amount: t.amount_stripe_denomination - t.child_records.refund.sum(:amount_stripe_denomination),
        }
      }

      render json: { charges: charges }, status: :ok
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end

  def payment_refund
    payment_id = params.require(:payment_id)

    # TODO: Why is this not referenced by our WCA-internal PI number?
    attendee_id = params.require(:attendee_id)
    competition_id, user_id = attendee_id.split("-")

    ms_registration = MicroserviceRegistration.find_by(competition_id: competition_id, user_id: user_id)
    return render status: :bad_request, json: { error: "Registration not found" } unless ms_registration.present?

    competition = ms_registration.competition
    stripe_integration = competition.payment_account_for(:stripe)

    return render json: { error: "no_stripe" } unless stripe_integration.present?
    return render status: :unauthorized, json: { error: 'unauthorized' } unless current_user.can_manage_competition?(competition)

    charge = StripeRecord.find(payment_id)

    return render json: { error: "invalid_transaction" } unless charge.present?

    return render json: { error: "non_refundable" } unless charge.charge?

    refund_amount_param = params.require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    return render json: { error: "refund_zero" } if refund_amount < 0

    refund_receipt = stripe_integration.issue_refund(charge.stripe_id, refund_amount)

    # TODO: I'd rather not send this because it's implicitly clear we only allow refunds in the same currency
    #   that the original payment was also made in.
    currency_iso = refund_receipt.currency_code

    begin
      Microservices::Registrations.update_registration_payment(attendee_id, refund_receipt.id, refund_amount, currency_iso, "refund")
    rescue Faraday::Error
      return render json: { error: "registration_unreachable" }
    end

    render json: { status: "ok" }
  end
end
