# frozen_string_literal: true

EnvVars = Env::Vars.new(
  env: {
    "DISABLE_BULLET" => false,
    "WCA_LIVE_SITE" => false,
    "GOOGLE_MAPS_API_KEY" => 'AIzaSyDYBIU04Tv_j914utSX9OJhJDxi7eiZ84w',
    "GITHUB_CREATE_PR_ACCESS_TOKEN" => '',
    "STRIPE_API_KEY" => 'sk_test_CY2eQJchZKUrPGQtJ3Z60ycA',
    "STRIPE_PUBLISHABLE_KEY" => 'pk_test_N0KdZIOedIrP8C4bD5XLUxOY',
    "STRIPE_CLIENT_ID" => 'ca_A2YDwmyOll0aORNYiOA41dzEWn4xIDS2',
    "OTP_ENCRYPTION_KEY" => 'abcdefghijklmnopqrstuvwxyz1234567890',
    "DISCOURSE_SECRET" => 'myawesomesharedsecret',
    "DISCOURSE_URL" => 'https://forum.worldcubeassociation.org',
  },
) do
  if Rails.env.production?
    optional :SECRET_KEY_BASE, string
    optional :DATABASE_URL, string
    optional :SMTP_USERNAME, string
    optional :SMTP_PASSWORD, string
  end

  if Rails.env.development?
    mandatory :DISABLE_BULLET, :bool
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
    default_root_url = "http://test.host"
  end

  optional :ROOT_URL, :string, default_root_url

  optional :RECAPTCHA_PUBLIC_KEY, :string, ''
  optional :RECAPTCHA_PRIVATE_KEY, :string, ''
  optional :NEW_RELIC_LICENSE_KEY, :string, ''

  mandatory :GOOGLE_MAPS_API_KEY, :string
  mandatory :GITHUB_CREATE_PR_ACCESS_TOKEN, :string
  mandatory :STRIPE_API_KEY, :string
  mandatory :STRIPE_PUBLISHABLE_KEY, :string
  mandatory :STRIPE_CLIENT_ID, :string
  mandatory :OTP_ENCRYPTION_KEY, :string
  mandatory :DISCOURSE_SECRET, :string
  mandatory :DISCOURSE_URL, :string
end
