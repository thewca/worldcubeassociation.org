# frozen_string_literal: true

require_relative '../helpers/microservices_helper'

class PaymentController < ApplicationController
  def payment_config
    competition = Competition.find(params[:competition_id])
    render json: { stripe_publishable_key: EnvVars.STRIPE_PUBLISHABLE_KEY, connected_account_id: competition.connected_stripe_account_id }
  end

  def payment_finish
    competition = Competition.find(params[:competition_id])

    # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
    intent_id = params[:payment_intent]
    intent_secret = params[:payment_intent_client_secret]

    stored_transaction = StripeTransaction.find_by(stripe_id: intent_id)
    stored_intent = stored_transaction.stripe_payment_intent

    unless stored_intent.client_secret == intent_secret
      flash[:error] = t("registrations.payment_form.errors.stripe_secret_invalid")
      return redirect_to competition_register_path(competition)
    end

    # No need to create a new intent here. We can just query the stored intent from Stripe directly.
    stripe_intent = stored_intent.retrieve_intent

    unless stripe_intent.present?
      flash[:error] = t("registrations.payment_form.errors.stripe_not_found")
      return redirect_to competition_register_path(competition)
    end

    stored_intent.update_status_and_charges(stripe_intent, current_user) do |charge_transaction|
      ruby_money = charge_transaction.money_amount
      registration_payments.create!(
        amount_lowest_denomination: ruby_money.cents,
        currency_code: ruby_money.currency.iso_code,
        receipt: charge_transaction,
        user_id: current_user.id,
      )
    end

    # Payment Intent lifecycle as per https://stripe.com/docs/payments/intents#intent-statuses
    case stored_transaction.status
    when 'succeeded'
      flash[:success] = t("registrations.payment_form.payment_successful")
    when 'requires_action'
      # Customer did not complete the payment
      # For example, 3DSecure could still be pending.
      flash[:warning] = t("registrations.payment_form.errors.payment_pending")
    when 'requires_payment_method'
      # Payment failed. If a payment fails, it is "reset" by Stripe,
      # so from our end it looks like it never even started (i.e. the customer didn't choose a payment method yet)
      flash[:error] = t("registrations.payment_form.errors.payment_reset")
    when 'processing'
      # The payment can be pending, for example bank transfers can take multiple days to be fulfilled.
      flash[:warning] = t("registrations.payment_form.payment_processing")
    else
      # Invalid status
      flash[:error] = "Invalid PaymentIntent status"
    end

    redirect_to competition_register_path(competition_id)
  end

  def payment_refund
    competition_id, user_id = params["attendee_id"].split("-")
    competition = Competition.find(competition_id)

    unless competition.using_stripe_payments?
      flash[:danger] = "You cannot emit refund for this competition anymore. Please use your Stripe dashboard to do so."
      return redirect_to edit_registration_path(competition_id, user_id)
    end

    payment = RegistrationPayment.find(params[:payment_id])

    refund_amount_param = params.require(:payment).require(:refund_amount)
    refund_amount = refund_amount_param.to_i

    if refund_amount > payment.amount_available_for_refund
      flash[:danger] = "You are not allowed to refund more than the competitor has paid."
      return redirect_to edit_registration_path(competition_id, user_id)
    end

    if refund_amount < 0
      flash[:danger] = "The refund amount must be greater than zero."
      return redirect_to edit_registration_path(competition_id, user_id)
    end

    currency_iso = competition.currency_code
    stripe_amount = StripeTransaction.amount_to_stripe(refund_amount, currency_iso)

    # Backwards compatibility: We may at some point try to record a refund for a payment that was
    #   - created before the introduction of receipts
    #   - but refunded after the new receipts feature was introduced. Fall back to the old stripe_charge_id if that happens.
    charge_id = payment.receipt&.stripe_id || payment.stripe_charge_id

    refund_args = {
      charge: charge_id,
      amount: stripe_amount,
    }

    account_id = competition.connected_stripe_account_id

    refund = Stripe::Refund.create(
      refund_args,
      stripe_account: account_id,
    )

    refund_receipt = StripeTransaction.create_from_api(refund, refund_args, account_id)
    refund_receipt.update!(parent_transaction: payment.receipt) if payment.receipt.present?

    # Should be the same as `refund_amount`, but by double-converting from the Stripe object
    # we can also double-check that they're on the same page as we are (to be _really_ sure!)
    ruby_money = refund_receipt.money_amount

    registration_payments.create!(
      amount_lowest_denomination: ruby_money.cents * -1,
      currency_code: ruby_money.currency.iso_code,
      receipt: refund_receipt,
      refunded_registration_payment_id: payment.id,
      user_id: current_user.id,
    )

    flash[:success] = 'Payment was refunded'
    redirect_to edit_registration_path(competition_id, user_id)
  end
end
