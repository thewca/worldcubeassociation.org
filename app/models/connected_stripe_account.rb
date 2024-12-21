# frozen_string_literal: true

class ConnectedStripeAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account

  def prepare_intent(registration, amount_iso, currency_iso, paying_user)
    registration.payment_intents
                .incomplete
                .stripe
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

  # This method implements the PaymentElements workflow described at:
  # - https://stripe.com/docs/payments/quickstart
  # - https://stripe.com/docs/payments/accept-a-payment
  # - https://stripe.com/docs/payments/accept-a-payment?ui=elements
  # It essentially creates a PaymentIntent for the current user-specified amount.
  # Everything after the creation of the intent is handled by Stripe through their JS integration.
  # At the very end, when the process is finished, it redirects the user to a return URL that we specified.
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
    # See also https://docs.stripe.com/upgrades/manage-payment-methods
    allow_redirects = Rails.env.test? ? 'never' : 'always'

    payment_intent_args = {
      amount: stripe_amount,
      currency: currency_iso,
      receipt_email: registration.user.email,
      description: "Registration payment for #{registration.competition.name}",
      metadata: registration_metadata,
      # we cannot recycle an existing intent, so we create a new one which needs all possible PaymentMethods enabled.
      # Required as per https://stripe.com/docs/payments/accept-a-payment-deferred?type=payment&client=html#create-intent
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: allow_redirects,
      },
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

  def find_payment(record_id)
    StripeRecord.charge.find(record_id)
  end

  def find_payment_from_request(params)
    # Provided by Stripe upon redirect when the "PaymentElement" workflow is completed
    intent_id = params[:payment_intent]
    intent_secret = params[:payment_intent_client_secret]

    # We expect that the record here is a top-level PaymentIntent in Stripe's API model
    stored_record = StripeRecord.payment_intent.find_by(stripe_id: intent_id)

    [stored_record, intent_secret]
  end

  def issue_refund(charge_record, amount_iso)
    currency_iso = charge_record.currency_code
    stripe_amount = StripeRecord.amount_to_stripe(amount_iso, currency_iso)

    refund_args = {
      charge: charge_record.stripe_id,
      amount: stripe_amount,
    }

    refund = Stripe::Refund.create(
      refund_args,
      stripe_account: self.account_id,
    )

    StripeRecord.create_from_api(refund, refund_args, self.account_id, charge_record)
  end

  def account_details
    stripe_acct = Stripe::Account.retrieve(self.account_id)

    stripe_acct.as_json.slice("email", "country").merge({
                                                          "business_name" => stripe_acct.business_profile.name,
                                                        })
  end

  def self.generate_onboarding_link(competition_id)
    client = self.oauth_client

    oauth_params = {
      scope: 'read_write',
      redirect_uri: Rails.application.routes.url_helpers.competitions_stripe_connect_url(host: EnvConfig.ROOT_URL),
      state: competition_id,
    }

    client.auth_code.authorize_url(oauth_params)
  end

  def self.connect_account(oauth_return_params)
    client = self.oauth_client

    resp = client.auth_code.get_token(
      oauth_return_params[:code],
      params: { scope: 'read_write' },
    )

    ConnectedStripeAccount.new(
      account_id: resp.params['stripe_user_id'],
    )
  end

  # See https://docs.stripe.com/connect/oauth-reference
  private_class_method def self.oauth_client
    options = {
      site: 'https://connect.stripe.com',
      authorize_url: '/oauth/authorize',
      token_url: '/oauth/token',
      auth_scheme: :request_body,
    }

    OAuth2::Client.new(AppSecrets.STRIPE_CLIENT_ID, AppSecrets.STRIPE_API_KEY, options)
  end
end
