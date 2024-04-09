# frozen_string_literal: true

class ConnectedStripeAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def prepare_intent(registration, amount_iso, currency_iso, paying_user)
    registration.payment_intents
                .incomplete
                .each do |intent|
      if intent.account_id == self.account_id && intent.created?
        # Send the updated parameters to Stripe (maybe the user decided to donate in the meantime,
        # so we need to make sure that the correct amount is being used)
        intent.payment_record.update_amount_remote(amount_iso, currency_iso)

        return intent
      end
    end

    self.create_intent(registration, amount_iso, currency_iso, paying_user)
  end

  private def create_intent(registration, amount_iso, currency_iso, paying_user)
    stripe_amount = StripeRecord.amount_to_stripe(amount_iso, currency_iso)

    registration_metadata = {
      competition: registration.competition_id,
      user: registration.user_id,
      registration_type: registration.model_name,
      registration_id: registration.id,
    }

    # The Stripe API forces the user to provide a return_url when using automated payment methods.
    # In our test suite however, we want to be able to confirm specific payment methods without a return URL
    # because our CI containers are not exposed to the public. So we need this little hack :/
    enable_automatic_pm = !Rails.env.test?

    payment_intent_args = {
      amount: stripe_amount,
      currency: currency_iso,
      receipt_email: registration.user.email,
      description: "Registration payment for #{registration.competition.name}",
      metadata: registration_metadata,
      # we cannot recycle an existing intent, so we create a new one which needs all possible PaymentMethods enabled.
      # Required as per https://stripe.com/docs/payments/accept-a-payment-deferred?type=payment&client=html#create-intent
      automatic_payment_methods: { enabled: enable_automatic_pm },
    }

    # Create the PaymentIntent, overriding the stripe_account for the request
    # by the connected stripe account for the competition.
    intent = Stripe::PaymentIntent.create(
      payment_intent_args,
      stripe_account: self.account_id,
    )

    # Log the payment attempt. We register the payment intent ID to find it later after checkout completed.
    stripe_record = StripeRecord.create_from_api(intent, payment_intent_args, self.account_id)

    # memoize the payment intent in our DB because payments are handled asynchronously
    # so we need to be able to retrieve this later at any time, even when our server crashes in the meantime…
    PaymentIntent.create!(
      holder: registration,
      payment_record: stripe_record,
      client_secret: intent.client_secret,
      initiated_by: paying_user,
      wca_status: stripe_record.determine_wca_status,
    )
  end

  def issue_refund(charge_id, amount_iso)
    charge_record = StripeRecord.charge.find_by!(stripe_id: charge_id)

    currency_iso = charge_record.currency_code
    stripe_amount = StripeRecord.amount_to_stripe(amount_iso, currency_iso)

    refund_args = {
      charge: charge_id,
      amount: stripe_amount,
    }

    refund = Stripe::Refund.create(
      refund_args,
      stripe_account: self.account_id,
    )

    StripeRecord.create_from_api(refund, refund_args, self.account_id, charge_record)
  end
end
