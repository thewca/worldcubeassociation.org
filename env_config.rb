# frozen_string_literal: true

require "superconfig"

is_compiling_assets = ENV.fetch("ASSETS_COMPILATION", false)

EnvConfig = SuperConfig.new(raise_exception: !is_compiling_assets) do
  if Rails.env.production?
    mandatory :READ_REPLICA_HOST, :string
    mandatory :CACHE_REDIS_URL, :string
    mandatory :SIDEKIQ_REDIS_URL, :string
    mandatory :DISCOURSE_URL, :string
    mandatory :STORAGE_AWS_BUCKET, :string
    mandatory :STORAGE_AWS_REGION, :string
    mandatory :S3_AVATARS_BUCKET, :string
    mandatory :S3_AVATARS_ASSET_HOST, :string
    mandatory :S3_AVATARS_REGION, :string
    mandatory :CDN_AVATARS_DISTRIBUTION_ID, :string
    mandatory :DATABASE_AWS_REGION, :string
    mandatory :DATABASE_WRT_USER, :string
    optional :PAYPAL_BASE_URL, :string ## TODO: Change to mandatory when launching paypal

    # Production-specific stuff
    mandatory :VAULT_ADDR, :string
    mandatory :VAULT_APPLICATION, :string
    mandatory :VAULT_AWS_REGION, :string
    mandatory :TASK_ROLE, :string
    mandatory :WCA_REGISTRATIONS_URL, :string
    mandatory :WCA_REGISTRATIONS_POLL_URL, :string
  else
    optional :READ_REPLICA_HOST, :string, ''
    optional :CACHE_REDIS_URL, :string, ''
    optional :SIDEKIQ_REDIS_URL, :string, ''
    optional :DISCOURSE_URL, :string, ''
    optional :STORAGE_AWS_BUCKET, :string, ''
    optional :STORAGE_AWS_REGION, :string, ''
    optional :S3_AVATARS_BUCKET, :string, ''
    optional :S3_AVATARS_ASSET_HOST, :string, ''
    optional :S3_AVATARS_REGION, :string, ''
    optional :CDN_AVATARS_DISTRIBUTION_ID, :string, ''
    optional :DATABASE_AWS_REGION, :string, ''
    optional :DATABASE_WRT_USER, :string, ''
    optional :WCA_REGISTRATIONS_URL, :string, ''
    optional :WCA_REGISTRATIONS_POLL_URL, :string, ''
    optional :PAYPAL_BASE_URL, :string, ''

    # Local-specific stuff
    optional :DISABLE_BULLET, :bool, false
    optional :MAILCATCHER_SMTP_HOST, :string, ''
    mandatory :WCA_REGISTRATIONS_BACKEND_URL, :string
  end

  if Rails.env.test?
    optional :DISABLE_WEBMOCK, :bool, false
    optional :DISABLE_NET_CONNECT_IN_TESTS, :bool, false
    optional :SKIP_PRETEST_SETUP, :bool, false
  end

  # Set WCA_LIVE_SITE to enable Google Analytics
  # and allow all on robots.txt.
  mandatory :WCA_LIVE_SITE, :bool
  mandatory :DATABASE_HOST, :string

  # ROOT_URL is used when generating full urls (rather than relative urls).
  # Trick to discover the port we're set to run on from
  # https://stackoverflow.com/a/48069920/1739415.
  if Rails.env.test?
    default_root_url = "http://test.host"
  elsif defined? Rails::Server
    # We have to check if Rails::Server is defined, because when running the
    # rails console under spring, Rails::Server is not defined, nor is it
    # importable.
    port = Rails::Server::Options.new.parse!(ARGV)[:Port]
    default_root_url = "http://localhost:#{port}"
  else
    default_root_url = "http://default.host"
  end

  optional :ROOT_URL, :string, default_root_url

  # For server status
  optional :BUILD_TAG, :string, "local"

  # To allow logging in to staging with your prod account
  optional :STAGING_OAUTH_URL, :string, ""

  # For Asset Compilation
  optional :ASSETS_COMPILATION, :bool, false
end

# Require Asset Specific ENV variables
if EnvConfig.ASSETS_COMPILATION?
  require 'dotenv'
  Dotenv.load(EnvConfig.WCA_LIVE_SITE? ? '.env.assets.production' : '.env.assets.staging')
end
