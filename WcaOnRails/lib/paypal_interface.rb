# frozen_string_literal: true

module PaypalInterface
  def self.generate_paypal_onboarding_link(competition_id)
    url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/customer/partner-referrals"

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
        return_url: EnvConfig.ROOT_URL + Rails.application.routes.url_helpers.competitions_paypal_return_path(competition_id),
        return_url_description: "the url to return the WCA after the paypal onboarding process.",
      },
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true,
        },
      ],
    }

    response = paypal_connection(url).post do |req|
      req.body = payload
    end

    response.body['links'].each do |link|
      if link['rel'] == "action_url"
        return link['href']
      end
    end
  end

  def self.create_order(registration)
    url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders"

    outstanding_fees = registration.outstanding_entry_fees
    fee_currency = outstanding_fees.currency.iso_code

    payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: fee_currency.to_s, value: outstanding_fees.to_s },
        },
      ],
    }

    response = paypal_connection(url).post do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = get_paypal_auth_assertion(registration.competition)

      req.body = payload
    end
    response.body
  end

  def self.capture_payment(competition, order_id)
    url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders/#{order_id}/capture"

    response = paypal_connection(url).post do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = AppSecrets.PAYPAL_ATTRIBUTION_CODE
      req.headers['PayPal-Auth-Assertion'] = get_paypal_auth_assertion(competition)
    end

    response.body
  end

  private_class_method def self.paypal_connection(url)
    Faraday.new(
      url: url,
      headers: {
        'Authorization' => "Bearer #{generate_access_token}",
        'Content-Type' => 'application/json',
      },
    ) do |builder|
      # Sets headers and parses jsons automatically
      builder.request :json
      builder.response :json

      # Raises an error on 4xx and 5xx responses.
      builder.response :raise_error

      # Logs requests and responses.
      # By default, it only logs the request method and URL, and the request/response headers.
      builder.response :logger
    end
  end

  private_class_method def self.generate_access_token
    options = {
      site: EnvConfig.PAYPAL_BASE_URL,
      token_url: '/v1/oauth2/token',
    }

    client = OAuth2::Client.new(AppSecrets.PAYPAL_CLIENT_ID, AppSecrets.PAYPAL_CLIENT_SECRET, options)
    client.client_credentials.get_token.token
  end

  private_class_method def self.get_paypal_auth_assertion(competition)
    payload = { "iss" => AppSecrets.PAYPAL_CLIENT_ID, "payer_id" => competition.payment_account_for(:paypal).paypal_merchant_id }
    JWT.encode payload, nil, 'none'
  end
end
