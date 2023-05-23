# frozen_string_literal: true

EnvVars = SuperConfig.new do
  if Rails.env.production?
    mandatory :SECRET_KEY_BASE, :string
    mandatory :DATABASE_HOST, :string
    mandatory :DATABASE_PASSWORD, :string
    mandatory :SMTP_USERNAME, :string
    mandatory :SMTP_PASSWORD, :string
  end

  unless Rails.env.production?
    mandatory :ENABLE_BULLET, :bool

    optional :AWS_ACCESS_KEY_ID, :string, ''
    optional :AWS_SECRET_ACCESS_KEY, :string, ''
  end

  # Set WCA_LIVE_SITE to enable Google Analytics
  # and allow all on robots.txt.
  mandatory :WCA_LIVE_SITE, :bool

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

  optional :RECAPTCHA_PUBLIC_KEY, :string, ''
  optional :RECAPTCHA_PRIVATE_KEY, :string, ''
  optional :NEW_RELIC_LICENSE_KEY, :string, ''
  optional :CDN_AVATARS_DISTRIBUTION_ID, :string, ''

  mandatory :GOOGLE_MAPS_API_KEY, :string
  mandatory :GITHUB_CREATE_PR_ACCESS_TOKEN, :string
  mandatory :STRIPE_API_KEY, :string
  mandatory :STRIPE_PUBLISHABLE_KEY, :string
  mandatory :STRIPE_CLIENT_ID, :string
  mandatory :OTP_ENCRYPTION_KEY, :string
  mandatory :DISCOURSE_SECRET, :string
  mandatory :DISCOURSE_URL, :string
  mandatory :SURVEY_SECRET, :string
  mandatory :S3_AVATARS_BUCKET, :string
  mandatory :S3_AVATARS_ASSET_HOST, :string
  mandatory :S3_AVATARS_REGION, :string
  mandatory :ACTIVERECORD_PRIMARY_KEY, :string
  mandatory :ACTIVERECORD_DETERMINISTIC_KEY, :string
  mandatory :ACTIVERECORD_KEY_DERIVATION_SALT, :string
end
