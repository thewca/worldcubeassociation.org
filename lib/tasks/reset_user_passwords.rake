# frozen_string_literal: true

def enc_password(plaintext_pw)
  User.new(password: plaintext_pw).encrypted_password
end

namespace :user_passwords do
  namespace :reset do
    desc 'Make sure that we never run this on the live site'
    task check_live: :environment do
      if EnvConfig.WCA_LIVE_SITE?
        abort "This actions is disabled for the production server!"
      end
    end

    desc 'Reset all user passwords to the secret defined in Vault "STAGING_PASSWORD"'
    task private: [:environment, :check_live] do
      secret_password = enc_password(AppSecrets.STAGING_PASSWORD)
      User.update_all(encrypted_password: secret_password)
    end

    desc 'Reset all user passwords to "wca". Use with caution!'
    task public: [:environment, :check_live] do
      wca_password = enc_password(DbDumpHelper::DEFAULT_DEV_PASSWORD)
      User.update_all(encrypted_password: wca_password)
    end

    desc 'Reset most user passwords to "wca". Only Delegates and Staff Members get the secret STAGING_PASSWORD.'
    task semi_public: [:environment, :public, :check_live] do
      secret_password = enc_password(AppSecrets.STAGING_PASSWORD)

      User.joins(:delegate_regions).update_all(encrypted_password: secret_password)
      User.joins(:teams_committees).update_all(encrypted_password: secret_password)
      User.joins(:board_metadata).update_all(encrypted_password: secret_password)
    end
  end
end
