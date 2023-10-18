# frozen_string_literal: true


class PaymentController < ApplicationController
  def payment_config
    return render json: { error: "Please Log in" }, status: :unauthorized unless current_user.present?
    payment_id = params.require(:payment_id)
    competition_id = params.require(:competition_id)

    competition = Competition.find(competition_id)
    stripe_transaction = StripeTransaction.find(payment_id)

    render json: { stripe_publishable_key: EnvConfig.STRIPE_PUBLISHABLE_KEY, connected_account_id: competition.connected_stripe_account_id, client_secret: stripe_transaction.client_secret }
  end

  def payment_finish
    attendee_id = params.require(:attendee_id)
    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    competition_id = payment_request.competition_and_user_id
    competition = Competition.find(competition_id)

    # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
    intent_id = params[:payment_intent]
    intent_secret = params[:payment_intent_client_secret]

    stored_transaction = StripeTransaction.find_by(stripe_id: intent_id)
    stored_intent = stored_transaction.stripe_payment_intent

    return redirect_to competition_register_path(competition, "secret_invalid") unless stored_intent.client_secret == intent_secret

    # No need to create a new intent here. We can just query the stored intent from Stripe directly.
    stripe_intent = stored_intent.retrieve_intent

    return redirect_to competition_register_path(competition, "not_found") unless stripe_intent.present?

    stored_intent.update_status_and_charges(stripe_intent, current_user) do |charge|
      begin
        ruby_money = charge_transaction.money_amount
        update_registration_payment(attendee_id, charge.id, ruby_money.cents, ruby_money.currency.iso_code, stripe_intent.status)
      rescue Faraday::Error
        return redirect_to competition_register_path(competition_id, "registration_down")
      end
    end

    redirect_to competition_register_path(competition_id, stored_transaction.status)
  end

  def available_refunds
    attendee_id = params.require(:attendee_id)
    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    transactions = StripeTransaction.where(stripe_id: payment_request.stripe_payment_intent.id)
    render json: { charges: transactions.pluck(:id) }, status: :ok
  end

  def payment_refund
    payment_id = params.require(:payment_id)
    attendee_id = params.require(:attendee_id)

    payment_request = AttendeePaymentRequest.find_by(attendee_id: attendee_id)
    competition_id, user_id = payment_request.competition_and_user_id
    competition = Competition.find(competition_id)

    unless competition.using_stripe_payments?
      return redirect_to edit_registration_path(competition_id, user_id, "no_stripe")
    end

    charge = StripeTransaction.find(payment_id)

    refund_amount_param = params.require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    if refund_amount < 0
      return redirect_to edit_registration_path(competition_id, user_id, "refund_zero")
    end

    currency_iso = competition.currency_code
    stripe_amount = StripeTransaction.amount_to_stripe(refund_amount, currency_iso)

    refund_args = {
      charge: charge.id,
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
      update_registration_payment(attendee_id, refund_receipt.id, refund_amount, currency_iso, "refund")
    rescue Faraday::Error
      return redirect_to edit_registration_path(competition_id, user_id, "registration_down")
    end

    redirect_to edit_registration_path(competition_id, user_id)
  end
end
