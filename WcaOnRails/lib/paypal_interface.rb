# frozen_string_literal: true

module PaypalInterface
  def self.generate_paypal_onboarding_link(competition_id)
    # TODO: Move to EnvConfig
    url = 'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals'
    # TODO: This will need to be requested using our clientId and secret - for now, I'm using postman
    access_token = generate_access_token

    # TODO: We could add in a tracking ID if we want to - this would be a good idea
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
        # return_url: EnvConfig.ROOT_URL + end_path,
        return_url_description: "the url to return the WCA after the paypal onboarding process.",
      },
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true,
        },
      ],
    }

    conn = Faraday.new(url) do |faraday|
      faraday.request :json
      faraday.adapter Faraday.default_adapter
    end

    response = conn.post do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Bearer #{access_token}"
      req.body = payload.to_json
    end

    body = JSON.parse(response.body)
    body['links'].each do |link|
      if link['rel'] == "action_url"
        return link['href']
      end
    end
  end

  def self.create_order(competition)
    puts competition.inspect
    access_token = generate_access_token
    url = "#{base_url}/v2/checkout/orders"

    response = Faraday.post(url) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Bearer #{access_token}"
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

    JSON.parse(response.body)
  end

  def self.capture_payment(competition, order_id)
    access_token = generate_access_token
    url = "#{base_url}/v2/checkout/orders/#{order_id}/capture"

    response = Faraday.post(url) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Bearer #{access_token}"
      req.headers['PayPal-Partner-Attribution-Id'] = "FLAVORsb-noyt529176316_MP"
      req.headers['PayPal-Auth-Assertion'] = get_paypal_auth_assertion(competition)
    end

    JSON.parse(response.body)
  end

  class << self
    def generate_access_token
      auth = Base64.strict_encode64("#{AppSecrets.PAYPAL_CLIENT_ID}:#{AppSecrets.PAYPAL_CLIENT_SECRET}")
      response = Faraday.post("#{base_url}/v1/oauth2/token") do |req|
        req.body = 'grant_type=client_credentials'
        req.headers['Authorization'] = "Basic #{auth}"
      end

      data = JSON.parse(response.body)
      data['access_token']
    end
  end

  class << self
    def base_url
      Rails.env.production? ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
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
