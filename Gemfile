# frozen_string_literal: true

source 'https://rubygems.org'

gem 'rails'
gem 'rails-i18n'
gem 'i18n-js'
gem 'activerecord-import'
gem 'sass-rails'
# Some of our very old Sprockets asset code relies on gem-bundled Bootstrap 3 (grrr...)
#   which uses SCSS features incompatible with Dart SASS 2.
gem "sassc-embedded", '~> 1'
gem 'terser'
gem 'faraday'
gem 'faraday-retry'
gem 'sdoc', group: :doc
gem 'dotenv-rails', require: 'dotenv/load'
gem 'seedbank'
gem 'jbuilder'
gem 'bootstrap-sass'
gem 'mail_form'
gem 'simple_form'
gem 'valid_email'
gem 'recaptcha', require: 'recaptcha/rails'
gem 'kaminari'
gem 'kaminari-i18n'
gem 'devise'
# NOTE: we put devise-18n before devise-bootstrap-views intentionally.
# See https://github.com/hisea/devise-bootstrap-views/issues/55 for more details.
gem 'devise-i18n'
gem 'devise-bootstrap-views'
gem 'devise-two-factor'
gem 'rqrcode'
gem 'doorkeeper'
gem 'doorkeeper-openid_connect'
gem 'doorkeeper-i18n'
gem 'strip_attributes'
gem 'time_will_tell', github: 'thewca/time_will_tell'
gem 'redcarpet'
gem 'bootstrap-table-rails'
gem 'money-rails'
gem 'money-currencylayer-bank'
gem 'octokit'
gem 'stripe'
gem 'oauth2'
gem 'openssl'
gem "vault"
gem 'wca_i18n'
gem 'cookies_eu'
gem 'superconfig'
gem 'eu_central_bank'
gem 'jwt'
gem 'iso', github: 'thewca/ruby-iso'
gem 'csv'

# Pointing to jfly/selectize-rails which has a workaround for
#  https://github.com/selectize/selectize.js/issues/953
gem 'selectize-rails', github: 'jfly/selectize-rails'

gem 'aws-sdk-s3'
gem 'aws-sdk-sqs'
gem 'aws-sdk-rds'
gem 'aws-sdk-cloudfront'

gem 'redis'
# Faster Redis library
gem 'hiredis'
gem 'mini_magick'
gem 'mysql2'
gem 'premailer-rails'
gem 'nokogiri'
gem 'cocoon'
gem 'momentjs-rails'
gem 'bootstrap3-datetimepicker-rails'
gem 'blocks'
gem 'rack-cors', require: 'rack/cors'
gem 'api-pagination'
gem 'daemons'
gem 'i18n-country-translations', github: 'thewca/i18n-country-translations'
gem 'http_accept_language'
gem 'twitter_cldr'
# version explicitly specified because Shakapacker wants to keep Gemfile and package.json in sync
gem 'shakapacker', '9.5.0'
gem 'json-schema'
gem 'translighterate'
gem 'enum_help'
gem 'google-apis-admin_directory_v1'
gem 'activestorage-validator'
gem 'image_processing'
gem 'rest-client'
gem 'icalendar'
gem 'react-rails'
gem 'sprockets-rails'
gem 'jaro_winkler'
gem 'sidekiq'
gem 'sidekiq-cron'
gem 'after_commit_everywhere'
gem 'slack-ruby-client'
gem 'puma'
gem 'tzf'
gem 'playwright-ruby-client', require: 'playwright'
gem 'hash_diff'
gem 'tsort'
gem 'html_safe_flash'
gem 'benchmark'

group :development, :test do
  gem 'spring'
  gem 'spring-commands-rspec'
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'capybara-screenshot'

  gem 'byebug'
  gem 'i18n-tasks'
  gem 'i18n-spec'

  # We may be able to remove this when a future version of bundler comes out.
  # See https://github.com/bundler/bundler/issues/6929#issuecomment-459151506 and
  # https://github.com/bundler/bundler/pull/6963 for more information.
  gem 'irb', require: false
end

group :development do
  gem 'overcommit', require: false
  gem 'rubocop', require: false
  gem 'rubocop-thread_safety', require: false
  gem 'rubocop-performance', require: false
  gem 'rubocop-rails', require: false
  gem 'rubocop-rspec', require: false
  gem 'rubocop-rspec_rails', require: false
  gem 'rubocop-factory_bot', require: false
  gem 'rubocop-capybara', require: false
  gem 'rubocop-rake', require: false
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'bullet'
  gem 'web-console'
end

group :test do
  gem 'rake' # As per http://docs.travis-ci.com/user/languages/ruby/
  gem 'rspec-retry'
  gem 'guard-rspec'
  gem 'launchy'
  gem 'capybara'
  gem 'oga' # XML parsing library introduced for testing RSS feed
  gem 'database_cleaner'
  gem 'rails-controller-testing'
  gem 'capybara-playwright-driver'
  gem 'simplecov', require: false
  gem 'simplecov-lcov', require: false
  gem 'timecop'
  gem 'webmock'
end

group :production do
  gem 'rack'
  gem 'newrelic_rpm'
  gem 'shoryuken'
end
