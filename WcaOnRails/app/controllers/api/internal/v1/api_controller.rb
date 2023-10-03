# frozen_string_literal: true

class Api::Internal::V1::ApiController < ApplicationController
  prepend_before_action :validate_token

  def validate_token
    service_token = request.headers["X-WCA-Service-Token"]
    unless service_token.present?
      return render json: { error: "Missing Authentication" }, status: :forbidden
    end
    response = Vault.with_retries(Vault::HTTPConnectionError) do
      Vault.logical.write("identity/oidc/introspect", data: { token: service_token })
    end
    unless response.data.present? && response.data[:active]
      render json: { error: "Authentication Expired or Token Invalid" }, status: :forbidden
    end
  end
end
