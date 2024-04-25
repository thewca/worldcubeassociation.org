# frozen_string_literal: true

class RemoveLegacyDeviseTwoFactorSecretsFromUsers < ActiveRecord::Migration[7.0]
  def change
    # WARNING: Only run this when you are confident you have copied the OTP
    # secret for ALL users from `encrypted_otp_secret` to `otp_secret`!
    remove_column :users, :encrypted_otp_secret
    remove_column :users, :encrypted_otp_secret_iv
    remove_column :users, :encrypted_otp_secret_salt
  end
end
