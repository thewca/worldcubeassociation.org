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
      req.body = payload.to_json
    end

    response.body['links'].each do |link|
      if link['rel'] == "action_url"
        return link['href']
      end
    end
  end

  def self.create_order(competition)
    url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders"

    response = paypal_connection(url).post do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = "FLAVORsb-noyt529176316_MP"
      req.headers['PayPal-Auth-Assertion'] = get_paypal_auth_assertion(competition)
      req.body = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: '100.00' },
          },
        ],
      }.to_json
    end

    response.body
  end

  def self.capture_payment(competition, order_id)
    url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders/#{order_id}/capture"

    response = paypal_connection(url).post do |req|
      req.headers['PayPal-Partner-Attribution-Id'] = "FLAVORsb-noyt529176316_MP"
      req.headers['PayPal-Auth-Assertion'] = get_paypal_auth_assertion(competition)
    end

    response.body
  end

  class << self
    def paypal_connection(url)
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
  end

  class << self
    def generate_access_token
      auth = Base64.strict_encode64("#{AppSecrets.PAYPAL_CLIENT_ID}:#{AppSecrets.PAYPAL_CLIENT_SECRET}")
      response = Faraday.post("#{EnvConfig.PAYPAL_BASE_URL}/v1/oauth2/token") do |req|
        req.body = 'grant_type=client_credentials'
        req.headers['Authorization'] = "Basic #{auth}"
      end

      JSON.parse(response.body)['access_token']
    end
  end

  class << self
    def get_paypal_auth_assertion(competition)
      header = { "alg" => "none" }
      encoded_header = base64url(header)

      payload = { "iss" => AppSecrets.PAYPAL_CLIENT_ID, "payer_id" => competition.connected_stripe_account_id }
      encoded_payload = base64url(payload)

      "#{encoded_header}.#{encoded_payload}."
    end
  end

  class << self
    private def base64url(json)
      Base64.urlsafe_encode64(json.to_json).gsub(/=+$/, '')
    end
  end
end
