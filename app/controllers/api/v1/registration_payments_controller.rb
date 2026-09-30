# frozen_string_literal: true

class Api::V1::RegistrationPaymentsController < Api::V1::ApiController
  def show
    registration_id = params.require(:registration_id)
    registration = Registration.includes(:competition, registration_payments: [:refunding_registration_payments]).find(registration_id)

    return head :unauthorized unless authenticated_user.id == registration.user_id || authenticated_user.can_manage_competition?(registration.competition)

    # Use `filter` here on purpose because the whole `registration_payments` list has been included above.
    #   Using `where` would create an SQL query, but it would also break (i.e. make redundant) the `includes` call above.
    root_payments = registration.registration_payments.filter { it.refunded_registration_payment_id.nil? }
    serialized_payments = root_payments.map { it.to_v2_json(refunds: true) }

    render json: { charges: serialized_payments }
  end

  def refund
    registration = Registration.includes(:competition).find(params.require(:id))
    competition = registration.competition

    return head :unauthorized unless @current_user.can_manage_competition?(competition)

    payment_integration = params.require(:payment_integration).to_sym
    payment_account = competition.payment_account_for(payment_integration)

    return render status: :not_found, json: { error: :provider_disconnected } if payment_account.blank?

    payment_record = payment_account.find_payment(params.require(:payment_id))

    # The payment id belongs to the provider rather than to us, so check that the record we just
    #   looked up really hangs off the registration we authorised against, and not off somebody
    #   else's registration at another competition.
    return head :not_found unless payment_record.root_record.payment_intent.holder == registration

    refund_amount = params.require(:payment).require(:refund_amount).to_i
    amount_left = payment_record.ruby_amount_available_for_refund - refund_amount

    return render status: :bad_request, json: { error: :refund_amount_too_high } if amount_left.negative?
    return render status: :bad_request, json: { error: :refund_amount_too_low } if refund_amount.negative?

    registration.with_lock do
      # It is crucial that we enter the `with_lock` first, and _then_ start
      #   triggering stuff in the Stripe API. Otherwise, in some rare cases,
      #   the async webhooks can kick in *very fast* and obtain the lock between
      #   "Stripe API refund issued" and "local lock here in this method obtained",
      #   leading to duplicates.
      refund_receipt = payment_account.issue_refund(payment_record, refund_amount)

      # Should be the same as `refund_amount`, but by double-converting from the Payment Gateway object
      # we can also double-check that they're on the same page as we are (to be _really_ sure!)
      ruby_money = refund_receipt.money_amount
      original_payment = payment_record.registration_payment

      already_refunded = original_payment.refunding_registration_payments.where(receipt: refund_receipt).any?

      unless already_refunded
        registration.record_refund(
          ruby_money.cents,
          ruby_money.currency.iso_code,
          refund_receipt,
          original_payment.id,
          @current_user.id,
        )
      end
    end

    # The `reload` is necessary here, because we just inserted a refund payment
    #   through the original `registration`. So the parent payment doesn't know about it yet.
    refunded_payment = payment_record.registration_payment.reload

    render json: { status: :ok, message: :charge_refunded, refunded_charge: refunded_payment.to_v2_json(refunds: true) }
  end
end
