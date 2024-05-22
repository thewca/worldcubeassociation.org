# frozen_string_literal: true

module PaypalInterface
  def self.paypal_disabled?
    Rails.env.production? && EnvConfig.WCA_LIVE_SITE?
  end

  def self.generate_paypal_onboarding_link(competition_id)
    url = "/v2/customer/partner-referrals"

    payload = {
      operations: [
        {
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: {
              integration_method: 'PAYPAL',
              integration_type: 'THIRD_PARTY',
              third_party_details: {
                features: ['PAYMENT', 'REFUND'],
              },
            },
          },
        },
      ],
      products: ['PPCP'], # TODO: Experiment with other payment types
      partner_config_override: {
        return_url: Rails.application.routes.url_helpers.competition_connect_payment_integration_url(competition_id, :paypal, host: EnvConfig.ROOT_URL),
        return_url_description: "the url to return the WCA after the paypal onboarding process.",
      },
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true,
        },
      ],
    }

    response = paypal_connection.post(url) do |req|
      req.body = payload
    end

    response.body['links'].each do |link|
      if link['rel'] == "action_url"
        return link['href']
      end
    end
  end

  def self.create_order(merchant_id, amount_iso, currency_code)
    url = "/v2/checkout/orders"

    amount_paypal = PaypalRecord.amount_to_paypal(amount_iso, currency_code)

    payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency_code,
            value: amount_paypal,
          },
        },
      ],
    }

    response = paypal_connection.post(url) do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = paypal_auth_assertion(merchant_id)

      req.body = payload
    end

    [payload, response.body]
  end

  def self.retrieve_order(merchant_id, order_id)
    url = "/v2/checkout/orders/#{order_id}"

    response = paypal_connection.get(url) do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = paypal_auth_assertion(merchant_id)
    end

    response.body
  end

  def self.capture_payment(merchant_id, order_id)
    url = "/v2/checkout/orders/#{order_id}/capture"

    response = paypal_connection.post(url) do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = paypal_auth_assertion(merchant_id)
    end

    response.body
  end

  def self.issue_refund(merchant_id, capture_id, amount_iso, currency_code)
    url = "/v2/payments/captures/#{capture_id}/refund"

    amount_paypal = PaypalRecord.amount_to_paypal(amount_iso, currency_code)

    payload = {
      amount: {
        currency_code: currency_code,
        value: amount_paypal,
      },
    }

    response = paypal_connection.post(url) do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = paypal_auth_assertion(merchant_id)

      req.body = payload
    end

    [payload, response.body]
  end

  private_class_method def self.paypal_connection
    Faraday.new(
      url: EnvConfig.PAYPAL_BASE_URL,
      headers: {
        'Authorization' => "Bearer #{generate_access_token}",
        'Content-Type' => 'application/json',
        'Prefer' => 'return=representation', # forces PayPal to return everything they known on every request
      },
    ) do |builder|
      # Sets headers and parses jsons automatically
      builder.request :json
      builder.response :json

      # Raises an error on 4xx and 5xx responses.
      builder.response :raise_error

      # Logs requests and responses.
      # By default, it only logs the request method and URL, and the request/response headers.
      builder.response :logger, ::Logger.new($stdout), bodies: true if Rails.env.development?
    end
  end

  private_class_method def self.generate_access_token
    return '' if Rails.env.test?

    options = {
      site: EnvConfig.PAYPAL_BASE_URL,
      token_url: '/v1/oauth2/token',
    }

    client = OAuth2::Client.new(AppSecrets.PAYPAL_CLIENT_ID, AppSecrets.PAYPAL_CLIENT_SECRET, options)
    client.client_credentials.get_token.token
  end

  private_class_method def self.paypal_auth_assertion(merchant_id)
    payload = { "iss" => AppSecrets.PAYPAL_CLIENT_ID, "payer_id" => merchant_id }
    JWT.encode payload, nil, 'none'
  end
end
