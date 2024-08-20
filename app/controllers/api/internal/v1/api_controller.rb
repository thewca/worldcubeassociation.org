# frozen_string_literal: true

class Api::Internal::V1::ApiController < ApplicationController
  prepend_before_action :validate_wca_token unless Rails.env.development?

  def validate_wca_token
    service_token = request.headers[Microservices::Auth::MICROSERVICE_AUTH_HEADER]
    return render json: { error: "Missing Authentication" }, status: :forbidden unless service_token.present?
    # The Vault CLI can't parse the response from identity/oidc/introspect so
    # we need to request it instead see https://github.com/hashicorp/vault/issues/9080

    vault_token_data = Vault.auth_token.lookup_self.data
    # Renew our token if it has expired or is close to expiring
    Vault.auth_token.renew_self if vault_token_data[:ttl] < 300

    client = Faraday.new(url: EnvConfig.VAULT_ADDR, &FaradayConfig)

    # Make the POST request to the introspect endpoint
    response = client.post('/v1/identity/oidc/introspect') do |req|
      req.headers['X-Vault-Token'] = vault_token_data[:id]
      req.body = { token: service_token }
    end
    if response.success?
      render json: { error: "Authentication Expired or Token Invalid" }, status: :forbidden unless response.body["active"]
    else
      raise "Introspection failed with the following error: #{response.status}, #{response.body}"
    end
  end
end
