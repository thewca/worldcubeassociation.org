# frozen_string_literal: true

module MicroServicesHelper
  # Because these routes don't live in the monolith anymore we need some helper functions
  def competition_register_path(competition_id)
    "https://#{EnvConfig.ROOT_URL}/competitions/#{competition_id}/register"
  end

  def edit_registration_path(competition_id, user_id)
    "https://#{EnvConfig.ROOT_URL}/competitions/#{competition_id}/#{user_id}/edit"
  end

  def update_payment_status_path
    "https://#{EnvConfig.WCA_REGISTRATION_URL}/api/internal/v1/update_payment"
  end

  def get_wca_token
    # Uses Vault ID Tokens: see https://developer.hashicorp.com/vault/docs/secrets/identity/identity-token
    Vault.with_retries(Vault::HTTPConnectionError) do
      data = Vault.logical.read("identity/oidc/token/#{EnvConfig.VAULT_APPLICATION}")
      if data.present?
        data.data[:data][:token]
      else # TODO: should we hard error out here?
        puts "Tried to get identity token, but got error"
      end
    end
  end
end
