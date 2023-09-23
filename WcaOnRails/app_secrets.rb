# frozen_string_literal: true

require "superconfig"

require_relative "env_config"

SuperConfig::Base.class_eval do
  # The skeleton is stolen from the source code of the `superconfig` gem, file lib/superconfig.rb:104
  #   (method SuperConfig::Base#credential). The inner Vault fetching logic is custom-written :)
  def vault(secret_name, &block)
    define_singleton_method(secret_name) do
      @__cache__["_vault_#{secret_name}".to_sym] ||= begin
        value = self.vault_read(secret_name)[:value]
        block ? block.call(value) : value
      end
    end
  end

  def vault_file(secret_name, file_path)
    define_singleton_method(secret_name) do
      unless File.exist? file_path
        value_raw = self.vault_read secret_name
        File.write file_path, value_raw.to_json
      end

      File.expand_path file_path
    end
  end

  private def vault_read(secret_name)
    Vault.with_retries(Vault::HTTPConnectionError, Vault::HTTPError) do |attempt, e|
      puts "Received exception #{e} from Vault - attempt #{attempt}" if e.present?

      secret = Vault.logical.read("kv/data/#{EnvConfig.VAULT_APPLICATION}/#{secret_name}")
      raise "Tried to read #{secret_name}, but doesn't exist" unless secret.present?

      secret.data[:data]
    end
  end
end

AppSecrets = SuperConfig.new do
  if Rails.env.production?
    require_relative "vault_config"

    vault :DATABASE_PASSWORD
    vault :GOOGLE_MAPS_API_KEY
    vault :GITHUB_CREATE_PR_ACCESS_TOKEN
    vault :STRIPE_API_KEY
    vault :OTP_ENCRYPTION_KEY
    vault :STRIPE_CLIENT_ID
    vault :DISCOURSE_SECRET
    vault :SURVEY_SECRET
    vault :ACTIVERECORD_PRIMARY_KEY
    vault :ACTIVERECORD_DETERMINISTIC_KEY
    vault :ACTIVERECORD_KEY_DERIVATION_SALT
    vault :RECAPTCHA_PRIVATE_KEY
    vault :SECRET_KEY_BASE
    vault :STRIPE_PUBLISHABLE_KEY
    vault :AWS_ACCESS_KEY_ID
    vault :AWS_SECRET_ACCESS_KEY
    vault :STRIPE_WEBHOOK_SECRET
    vault :RECAPTCHA_PUBLIC_KEY
    vault :CDN_AVATARS_DISTRIBUTION_ID
    vault :STAGING_PASSWORD
    vault :NEW_RELIC_LICENSE_KEY
    vault :SMTP_USERNAME
    vault :SMTP_PASSWORD
    vault_file :GOOGLE_APPLICATION_CREDENTIALS, "../secrets/application_default_credentials.json"
  else
    mandatory :DATABASE_PASSWORD, :string
    mandatory :GOOGLE_MAPS_API_KEY, :string
    mandatory :GITHUB_CREATE_PR_ACCESS_TOKEN, :string
    mandatory :STRIPE_API_KEY, :string
    mandatory :OTP_ENCRYPTION_KEY, :string
    mandatory :STRIPE_CLIENT_ID, :string
    mandatory :DISCOURSE_SECRET, :string
    mandatory :SURVEY_SECRET, :string
    mandatory :ACTIVERECORD_PRIMARY_KEY, :string
    mandatory :ACTIVERECORD_DETERMINISTIC_KEY, :string
    mandatory :ACTIVERECORD_KEY_DERIVATION_SALT, :string
    mandatory :SECRET_KEY_BASE, :string
    mandatory :STRIPE_PUBLISHABLE_KEY, :string

    optional :AWS_ACCESS_KEY_ID, :string, ''
    optional :AWS_SECRET_ACCESS_KEY, :string, ''
    optional :STRIPE_WEBHOOK_SECRET, :string, ''
    optional :RECAPTCHA_PUBLIC_KEY, :string, ''
    optional :RECAPTCHA_PRIVATE_KEY, :string, ''
    optional :CDN_AVATARS_DISTRIBUTION_ID, :string, ''
    optional :STAGING_PASSWORD, :string, ''
    optional :SMTP_USERNAME, :string, ''
    optional :SMTP_PASSWORD, :string, ''
    optional :GOOGLE_APPLICATION_CREDENTIALS, :string, ''
  end
end
