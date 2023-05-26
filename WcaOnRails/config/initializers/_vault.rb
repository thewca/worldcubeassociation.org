# This file starts with _ because it has to be the first one run
#frozen_string_literal: true

require "vault/rails"

Vault.configure do |vault|
  # Use Vault in transit mode for encrypting and decrypting data. If
  # disabled, vault-rails will encrypt data in-memory using a similar
  # algorithm to Vault. The in-memory store uses a predictable encryption
  # which is great for development and test, but should _never_ be used in
  # production. Default: ENV["VAULT_RAILS_ENABLED"].
  # Don't be confused even if this is disabled in dev, we still need a vault server as
  # this is for rails specific active record encryption
  vault.enabled = Rails.env.production?

  # The name of the application. All encrypted keys in Vault will be
  # prefixed with this application name. If you change the name of the
  # application, you will need to migrate the encrypted data to the new
  # key namespace. Default: ENV["VAULT_RAILS_APPLICATION"].
  # We save all our secrets in /secret/data/#{vault.application}/#{secret_name} using
  # Vault's kv2 secret engine
  if ENV["LIVE_SITE"].present?
    @vault_application = "wca-main-prod"
  else
    if Rails.env.production?
      @vault_application = "wca-main-staging"
    else
      @vault_application = "wca-main-dev"
    end
  end
  vault.application = @vault_application

  # The address of the Vault server, also read as ENV["VAULT_ADDR"]
  # TODO This is technically redundant, but should we still be explicit here?
  vault.address = ENV.fetch("VAULT_ADDR")

  # The token to authenticate with Vault, for prod auth is done via AWS
  if Rails.env.production?
    # Assume the correct role from the underlying instance
    role_credentials = Aws::InstanceProfileCredentials.new

    Vault.auth.aws_iam(ENV.fetch("INSTANCE_ROLE", nil), role_credentials, nil, "https://sts.#{ENV.fetch("AWS_REGION", nil)}.amazonaws.com")
  else
    vault.token = ENV.fetch("VAULT_DEV_ROOT_TOKEN_ID", nil)
  end


  # Use SSL verification, also read as ENV["VAULT_SSL_VERIFY"]
  vault.ssl_verify = false

  # Timeout the connection after a certain amount of time (seconds), also read
  # as ENV["VAULT_TIMEOUT"]
  vault.timeout = 30

  # It is also possible to have finer-grained controls over the timeouts, these
  # may also be read as environment variables
  vault.ssl_timeout  = 5
  vault.open_timeout = 5
  vault.read_timeout = 30
end


# Read a secret from Vault.
def read_secret(secret_name)
  Vault.with_retries(Vault::HTTPConnectionError, Vault::HTTPError) do |attempt, e|
    if e
      puts "Received exception #{e} from Vault - attempt #{attempt}"
    end
    secret = Vault.logical.read("secret/data/#{@vault_application}/#{secret_name}")
    if secret.present?
      secret.data[:data][:value]
    else # TODO should we hard error out here?
      puts "Tried to read #{secret_name}, but doesn´t exist"
    end
  end
end

def create_secret(secret_name, value)
  Vault.with_retries(Vault::HTTPConnectionError) do
    Vault.logical.write("secret/data/#{@vault_application}/#{secret_name}", data: { value: value })
  end
end

# Initialize secrets for dev and test, these are saved in .env.development and .env.test
def init
  create_secret("DATABASE_PASSWORD", EnvVars.DATABASE_PASSWORD)
  create_secret("RECAPTCHA_PRIVATE_KEY", EnvVars.RECAPTCHA_PRIVATE_KEY)
  create_secret("GOOGLE_MAPS_API_KEY", EnvVars.GOOGLE_MAPS_API_KEY)
  create_secret("GITHUB_CREATE_PR_ACCESS_TOKEN", EnvVars.GITHUB_CREATE_PR_ACCESS_TOKEN)
  create_secret("STRIPE_API_KEY", EnvVars.STRIPE_API_KEY)
  create_secret("STRIPE_CLIENT_ID", EnvVars.STRIPE_CLIENT_ID)
  create_secret("OTP_ENCRYPTION_KEY", EnvVars.OTP_ENCRYPTION_KEY)
  create_secret("DISCOURSE_SECRET", EnvVars.DISCOURSE_SECRET)
  create_secret("ACTIVERECORD_PRIMARY_KEY", EnvVars.ACTIVERECORD_PRIMARY_KEY)
  create_secret("ACTIVERECORD_DETERMINISTIC_KEY", EnvVars.ACTIVERECORD_DETERMINISTIC_KEY)
  create_secret("ACTIVERECORD_KEY_DERIVATION_SALT", EnvVars.ACTIVERECORD_KEY_DERIVATION_SALT)
  create_secret("SURVEY_SECRET", EnvVars.SURVEY_SECRET)
end

unless Rails.env.production?
  init
end
