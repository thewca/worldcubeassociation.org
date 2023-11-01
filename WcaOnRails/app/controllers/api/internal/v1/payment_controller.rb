# frozen_string_literal: true

class Api::Internal::V1::PaymentController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:init]
  def init
    attendee_id = params.require(:attendee_id)
    iso_amount = params.require(:amount)

    holder = AttendeePaymentRequest.create(attendee_id: attendee_id)
    competition_id, user_id = holder.competition_and_user_id

    competition = Competition.find(competition_id)
    user = User.find(user_id)
    render json: { error: "Registration not found" }, status: :not_found unless competition.present? && user.present?
    account_id = competition.connected_stripe_account_id

    registration_metadata = {
      competition: competition.name,
      registration_url: edit_registration_path(competition_id, user_id),
    }

    currency_iso = params["currency_code"]
    stripe_amount = StripeTransaction.amount_to_stripe(iso_amount, currency_iso)

    payment_intent_args = {
      amount: stripe_amount,
      currency: currency_iso,
      receipt_email: user.email,
      description: "Registration payment for #{competition.name}",
      metadata: registration_metadata,
    }

    # The Stripe API forces the user to provide a return_url when using automated payment methods.
    # In our test suite however, we want to be able to confirm specific payment methods without a return URL
    # because our CI containers are not exposed to the public. So we need this little hack :/
    enable_automatic_pm = !Rails.env.test?

    # we cannot recycle an existing intent, so we create a new one which needs all possible PaymentMethods enabled.
    # Required as per https://stripe.com/docs/payments/accept-a-payment-deferred?type=payment&client=html#create-intent
    payment_intent_args[:automatic_payment_methods] = { enabled: enable_automatic_pm }

    # Create the PaymentIntent, overriding the stripe_account for the request
    # by the connected stripe account for the competition.
    intent = Stripe::PaymentIntent.create(
      payment_intent_args,
      stripe_account: account_id,
    )

    # Log the payment attempt. We register the payment intent ID to find it later after checkout completed.
    stripe_transaction = StripeTransaction.create_from_api(intent, payment_intent_args, account_id)

    # memoize the payment intent in our DB because payments are handled asynchronously
    # so we need to be able to retrieve this later at any time, even when our server crashes in the meantime…
    StripePaymentIntent.create!(
      holder: holder,
      stripe_transaction: stripe_transaction,
      client_secret: intent.client_secret,
      user: user,
    )

    render json: { id: stripe_transaction.id }
  end
end
