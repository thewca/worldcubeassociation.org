# This file starts with _ because it has to be the first one run
# frozen_string_literal: true

require "vault/rails"

if Rails.env.production?
  Vault.configure do |vault|
    # Use Vault in transit mode for encrypting and decrypting data. If
    # disabled, vault-rails will encrypt data in-memory using a similar
    # algorithm to Vault. The in-memory store uses a predictable encryption
    # which is great for development and test, but should _never_ be used in
    # production. Default: ENV["VAULT_RAILS_ENABLED"].
    vault.enabled = true

    # The name of the application. All encrypted keys in Vault will be
    # prefixed with this application name. If you change the name of the
    # application, you will need to migrate the encrypted data to the new
    # key namespace. Default: ENV["VAULT_RAILS_APPLICATION"].
    # We save all our secrets in /secret/data/#{vault.application}/#{secret_name} using
    # Vault's kv2 secret engine
    if ENV["LIVE_SITE"].present?
      @vault_application = "wca-main-prod"
    else
      @vault_application = "wca-main-staging"
    end
    vault.application = @vault_application

    # The address of the Vault server, is read as ENV["VAULT_ADDR"]

    # Assume the correct role from the underlying instance
    role_credentials = Aws::InstanceProfileCredentials.new

    Vault.auth.aws_iam(ENV.fetch("INSTANCE_ROLE", nil), role_credentials, nil, "https://sts.#{ENV.fetch("AWS_REGION", nil)}.amazonaws.com")

    # Use SSL verification, also read as ENV["VAULT_SSL_VERIFY"]
    # We are using Vault in internal AWS Traffic only
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
end

# Read a secret from Vault or from the environment variable if we are in dev or test
def read_secret(secret_name)
  if Rails.env.production?
    Vault.with_retries(Vault::HTTPConnectionError, Vault::HTTPError) do |attempt, e|
      if e
        puts "Received exception #{e} from Vault - attempt #{attempt}"
      end
      secret = Vault.logical.read("secret/data/#{@vault_application}/#{secret_name}")
      if secret.present?
        secret.data[:data][:value]
      else
        raise "Tried to read #{secret_name}, but doesn´t exist"
      end
    end
  else
    ENV.fetch(secret_name, nil)
  end
end
