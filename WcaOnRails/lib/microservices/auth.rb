# frozen_string_literal: true

module MicroServicesAuth
  MICROSERVICE_AUTH_HEADER = 'X-WCA-Service-Token'
  def get_wca_token
    # Uses Vault ID Tokens: see https://developer.hashicorp.com/vault/docs/secrets/identity/identity-token
    Vault.with_retries(Vault::HTTPConnectionError) do
      data = Vault.logical.read("identity/oidc/token/#{EnvConfig.VAULT_APPLICATION}")
      raise Error "Can't get a Vault token" unless data.present?
      data.data[:data][:token]
    end
  end
end
