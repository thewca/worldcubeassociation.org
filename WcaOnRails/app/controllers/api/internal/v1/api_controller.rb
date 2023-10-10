# frozen_string_literal: true

class Api::Internal::V1::ApiController < ApplicationController
  prepend_before_action :validate_token
  WCA_SERVICE_TOKEN_HEADER = "X-WCA-Service-Token"
  def validate_token
    service_token = request.headers[WCA_SERVICE_TOKEN_HEADER]
    return render json: { error: "Missing Authentication" }, status: :forbidden unless service_token.present?
    response = Vault.with_retries(Vault::HTTPConnectionError) do
      Vault.logical.write("identity/oidc/introspect", data: { token: service_token })
    end
    render json: { error: "Authentication Expired or Token Invalid" }, status: :forbidden unless response.data.present? && response.data[:active]
  end
end
