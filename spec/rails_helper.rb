# frozen_string_literal: true

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require 'spec_helper'
require File.expand_path('../config/environment', __dir__)
require 'rspec/rails'
# Add additional requires below this line. Rails is not loaded until this point!

# From http://everydayrails.com/2012/04/24/testing-series-rspec-requests.html
require "capybara/rspec"
require 'capybara-screenshot/rspec'

require 'active_record/testing/query_assertions'

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot-up time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
Rails.root.glob('spec/support/**/*.rb').each { |f| require f }

# Checks for pending migrations before tests are run.
# If you are not using ActiveRecord, you can remove this line.
ActiveRecord::Migration.maintain_test_schema!

# To debug feature specs using apparition, set `Capybara.javascript_driver = :playwright_debug`
# and then call `page.driver.with_playwright_page { it.context.enable_debug_console!;it.pause }` in your feature spec.
# Yes, this snippet doesn't exactly roll off the tongue, but we need an upstream fix in the library to make it easier.
Capybara.register_driver :playwright_debug do |app|
  Capybara::Playwright::Driver.new(
    app,
    browser_server_endpoint_url: EnvConfig.PLAYWRIGHT_SERVER_SOCKET_URL,
    browser_type: :chromium,
    # For running Playwright browsers in headed mode, there has to be a writable X11 socket under `/tmp/.X11-unix`
    #   available in the container, and its user ID (file ownership) has to match the host system exactly.
    # See also the comment in `docker-compose.yml` for a sample implementation.
    headless: false,
    slowMo: 500,
  )
end

Capybara.register_driver :playwright do |app|
  if ENV["CI"].present?
    Capybara::Playwright::Driver.new(app, playwright_cli_executable_path: 'yarn playwright', channel: :chromium)
  else
    Capybara::Playwright::Driver.new(app, browser_server_endpoint_url: EnvConfig.PLAYWRIGHT_SERVER_SOCKET_URL, channel: :chromium)
  end
end

Capybara.javascript_driver = :playwright

# Recommended per https://playwright-ruby-client.vercel.app/docs/article/guides/rails_integration#update-timeout
Capybara.default_max_wait_time = 15

Capybara.app_host = EnvConfig.CAPYBARA_APP_HOST.presence

if EnvConfig.CAPYBARA_RUN_ON_HOST?
  Capybara.server_host = '0.0.0.0'
  Capybara.always_include_port = true
  Capybara.app_host = "http://hostmachine"
else
  Capybara.run_server = EnvConfig.CAPYBARA_APP_HOST.blank?
end

Capybara::Screenshot.register_driver :playwright do |driver, path|
  driver.save_screenshot(path)
end

Capybara::Screenshot.register_driver :playwright_debug do |driver, path|
  driver.save_screenshot(path)
end

RSpec.configure do |config|
  # enforce consistent locale behaviour across OSes, especially Linux
  # depending on the test driver, this might not be necessary but we want
  # consistent tests regardless of which driver we may end up using in the future
  config.before(:each) do
    if defined? page.driver.add_header
      page.driver.add_header("Accept-Language", "en-US", permanent: true)
    end
  end

  # We're using database_cleaner instead of rspec-rails's implicit wrapping of
  # tests in database transactions.
  # See http://devblog.avdi.org/2012/08/31/configuring-database_cleaner-with-rails-rspec-capybara-and-selenium/
  # See https://github.com/DatabaseCleaner/database_cleaner
  config.use_transactional_fixtures = false

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, type: :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://relishapp.com/rspec/rspec-rails/docs
  config.infer_spec_type_from_file_location!

  # Make helpers available in feature specs
  config.include SessionHelper, type: :feature
  config.include SelectizeHelper, type: :feature
  config.include AutonumericHelper, type: :feature
  config.include CookieBannerHelper, type: :feature

  # Make sign_in helper available in controller and request specs
  config.include ApiSignInHelper, type: :controller
  config.include ApiSignInHelper, type: :request

  config.include ApplicationHelper

  config.include ActiveJob::TestHelper
  config.include ActiveRecord::Assertions::QueryAssertions, type: :model

  config.include FactoryBot::Syntax::Methods

  if EnvConfig.DISABLE_WEBMOCK?
    WebMock.disable!
  else
    WebMock.allow_net_connect! unless EnvConfig.DISABLE_NET_CONNECT_IN_TESTS?
  end

  config.filter_run_excluding disabled: true if Rails.env.local?

  config.include ActiveSupport::Testing::TimeHelpers
end

# See: https://github.com/rspec/rspec-expectations/issues/664#issuecomment-58134735
RSpec::Matchers.define_negated_matcher :not_change, :change
