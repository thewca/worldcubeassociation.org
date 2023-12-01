# frozen_string_literal: true

class PaymentController < ApplicationController
  def payment_config
    payment_id = params.require(:payment_id)
    competition_id = params.require(:competition_id)

    competition = Competition.find(competition_id)
    stripe_transaction = StripeTransaction.find(payment_id)
    secret = stripe_transaction.stripe_payment_intent.client_secret
    render json: { stripe_publishable_key: AppSecrets.STRIPE_PUBLISHABLE_KEY,
                   connected_account_id: competition.connected_stripe_account_id,
                   client_secret: secret }
  end

  def payment_finish
    attendee_id = params.require(:attendee_id)
    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    return redirect_to Microservices::Registrations.competition_register_path(competition, "payment_not_found") unless payment_request.present?
    competition = payment_request.competition

    # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
    intent_id = params[:payment_intent]
    intent_secret = params[:payment_intent_client_secret]

    stored_transaction = StripeTransaction.find_by(stripe_id: intent_id)
    stored_intent = stored_transaction.stripe_payment_intent

    return redirect_to Microservices::Registrations.competition_register_path(competition.id, "secret_invalid") unless stored_intent.client_secret == intent_secret

    # No need to create a new intent here. We can just query the stored intent from Stripe directly.
    stripe_intent = stored_intent.retrieve_intent

    return redirect_to Microservices::Registrations.competition_register_path(competition.id, "intent_not_found") unless stripe_intent.present?

    stored_intent.update_status_and_charges(stripe_intent, current_user) do |charge|
      ruby_money = charge.money_amount
      begin
        Microservices::Registrations.update_registration_payment(attendee_id, charge.id, ruby_money.cents, ruby_money.currency.iso_code, stripe_intent.status)
      rescue Faraday::Error
        return redirect_to Microservices::Registrations.competition_register_path(competition.id, "registration_unreachable")
      end
    end

    redirect_to Microservices::Registrations.competition_register_path(competition.id, stored_transaction.status)
  end

  def available_refunds
    attendee_id = params.require(:attendee_id)
    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    transaction = payment_request.stripe_payment_intent

    charges = transaction.stripe_transaction.child_transactions.charge.map { |t|
      {
        payment_id: t.id,
        amount: t.amount_stripe_denomination - t.child_transactions.refund.sum(:amount_stripe_denomination),
      }
    }
    render json: { charges: charges }, status: :ok
  end

  def payment_refund
    payment_id = params.require(:payment_id)
    attendee_id = params.require(:attendee_id)

    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    competition = payment_request.competition

    return render json: { error: "no_stripe" } unless competition.using_stripe_payments?

    charge = StripeTransaction.find(payment_id)

    return render json: { error: "invalid_transaction" } unless charge.present?

    return render json: { error: "non_refundable" } unless charge.charge?

    refund_amount_param = params.require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    return render json: { error: "refund_zero" } if refund_amount < 0

    currency_iso = competition.currency_code
    stripe_amount = StripeTransaction.amount_to_stripe(refund_amount, currency_iso)

    refund_args = {
      charge: charge.stripe_id,
      amount: stripe_amount,
    }

    account_id = competition.connected_stripe_account_id

    refund = Stripe::Refund.create(
      refund_args,
      stripe_account: account_id,
    )

    refund_receipt = StripeTransaction.create_from_api(refund, refund_args, account_id)
    refund_receipt.update!(parent_transaction: charge)

    begin
      Microservices::Registrations.update_registration_payment(attendee_id, refund_receipt.id, refund_amount, currency_iso, "refund")
    rescue Faraday::Error
      return render json: { error: "registration_unreachable" }
    end

    render json: { status: "ok" }
  end
end
