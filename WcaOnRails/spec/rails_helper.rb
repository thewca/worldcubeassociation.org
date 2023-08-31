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
require 'capybara/apparition'

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
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }

# Checks for pending migrations before tests are run.
# If you are not using ActiveRecord, you can remove this line.
ActiveRecord::Migration.maintain_test_schema!

# To debug feature specs using apparition, set `Capybara.javascript_driver = :apparition_debug`
# and then call `page.driver.debug` in your feature spec.
Capybara.register_driver :apparition_debug do |app|
  Capybara::Apparition::Driver.new(app, inspector: true, debug: true, headless: false)
end

Capybara.register_driver :apparition do |app|
  Capybara::Apparition::Driver.new(app, js_errors: true, headless: true)
end

Capybara.javascript_driver = :apparition
Capybara.server = :webrick

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
  config.include CookieBannerHelper, type: :feature

  # Make sign_in helper available in controller and request specs
  config.include ApiSignInHelper, type: :controller
  config.include ApiSignInHelper, type: :request

  config.include ApplicationHelper

  config.include ActiveJob::TestHelper
end

# See: https://github.com/rspec/rspec-expectations/issues/664#issuecomment-58134735
RSpec::Matchers.define_negated_matcher :not_change, :change
