# frozen_string_literal: true

require "superconfig"

is_compiling_assets = ENV.fetch("ASSETS_COMPILATION", false)

EnvConfig = SuperConfig.new(raise_exception: !is_compiling_assets) do
  if Rails.env.production?
    mandatory :READ_REPLICA_HOST, :string
    mandatory :DEV_DUMP_HOST, :string
    mandatory :CACHE_REDIS_URL, :string
    mandatory :SIDEKIQ_REDIS_URL, :string
    mandatory :DISCOURSE_URL, :string
    mandatory :STORAGE_AWS_BUCKET, :string
    mandatory :S3_AVATARS_BUCKET, :string
    mandatory :S3_AVATARS_PRIVATE_BUCKET, :string
    mandatory :S3_AVATARS_ASSET_HOST, :string
    mandatory :AVATARS_PUBLIC_STORAGE, :string
    mandatory :AVATARS_PRIVATE_STORAGE, :string
    mandatory :CDN_AVATARS_DISTRIBUTION_ID, :string
    mandatory :AWS_REGION, :string
    mandatory :DATABASE_WRT_USER, :string
    mandatory :DATABASE_WRT_SENIOR_USER, :string
    optional :PAYPAL_BASE_URL, :string ## TODO: Change to mandatory when launching paypal
    mandatory :WRC_WEBHOOK_URL, :string

    # Production-specific stuff
    mandatory :VAULT_ADDR, :string
    mandatory :VAULT_APPLICATION, :string
    mandatory :TASK_ROLE, :string
    mandatory :WCA_REGISTRATIONS_URL, :string
    mandatory :ASSET_HOST, :string
    mandatory :CDN_ASSETS_DISTRIBUTION_ID, :string
    mandatory :REGISTRATION_QUEUE, :string
    mandatory :LIVE_QUEUE, :string

    if is_compiling_assets
      mandatory :V2_REGISTRATIONS_POLL_URL, :string
      mandatory :V3_REGISTRATIONS_POLL_URL, :string
    end
  else
    optional :READ_REPLICA_HOST, :string, ''
    optional :DEV_DUMP_HOST, :string, ''
    optional :CACHE_REDIS_URL, :string, ''
    optional :SIDEKIQ_REDIS_URL, :string, ''
    optional :DISCOURSE_URL, :string, ''
    optional :STORAGE_AWS_BUCKET, :string, ''
    optional :AWS_REGION, :string, ''
    optional :S3_AVATARS_BUCKET, :string, ''
    optional :S3_AVATARS_PRIVATE_BUCKET, :string, ''
    optional :S3_AVATARS_ASSET_HOST, :string, ''
    optional :AVATARS_PUBLIC_STORAGE, :string, ''
    optional :AVATARS_PRIVATE_STORAGE, :string, ''
    optional :CDN_AVATARS_DISTRIBUTION_ID, :string, ''
    optional :DATABASE_WRT_USER, :string, ''
    optional :DATABASE_WRT_SENIOR_USER, :string, ''
    optional :WCA_REGISTRATIONS_URL, :string, ''
    optional :WCA_REGISTRATIONS_POLL_URL, :string, ''
    optional :PAYPAL_BASE_URL, :string, ''
    optional :WRC_WEBHOOK_URL, :string, ''
    optional :REGISTRATION_QUEUE, :string, ''
    optional :LIVE_QUEUE, :string, ''
    optional :DEVELOPMENT_OFFLINE_MODE, :bool, false

    optional :V2_REGISTRATIONS_POLL_URL, :string, ''
    optional :V3_REGISTRATIONS_POLL_URL, :string, ''

    # Local-specific stuff
    optional :DISABLE_BULLET, :bool, false
    optional :MAILCATCHER_SMTP_HOST, :string, ''
    optional :ASSET_HOST, :string, ''
    optional :RUNNING_IN_DOCKER, :bool, false
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

  mandatory :DUMP_HOST, :string

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
  optional :OIDC_ISSUER, :string, default_root_url
  mandatory :OIDC_ALGORITHM, :string

  # For server status
  optional :BUILD_TAG, :string, "local"

  # To allow logging in to staging with your prod account
  optional :STAGING_OAUTH_URL, :string, ""

  # For Asset Compilation
  optional :ASSETS_COMPILATION, :bool, false

  # For local Playwright instances
  optional :PLAYWRIGHT_SERVER_SOCKET_URL, :string, ''
  optional :PLAYWRIGHT_BROWSERS_PATH, :string, ''
  optional :PLAYWRIGHT_RUN_LOCALLY, :bool, false

  # For developer setups who have a local Ruby runtime
  optional :CAPYBARA_RUN_ON_HOST, :bool, false
  optional :CAPYBARA_APP_HOST, :string, ''

  # For API Only Server
  optional :API_ONLY, :bool, false

  # For cronjob fine-tuning. Default value is recommended by sidekiq-cron.
  # Setting this value to 0 disables cron jobs altogether (for example, very useful to have on local)
  optional :CRONJOB_POLLING_SECONDS, :int, 30
end

# Require Asset Specific ENV variables
if EnvConfig.ASSETS_COMPILATION?
  require 'dotenv'
  Dotenv.load(EnvConfig.WCA_LIVE_SITE? ? '.env.assets.production' : '.env.assets.staging')
end
