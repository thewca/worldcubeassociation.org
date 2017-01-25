# frozen_string_literal: true
require File.expand_path('../boot', __FILE__)
require_relative '../lib/middlewares/fix_accept_header'
require_relative '../lib/middlewares/warden_user_logger'
require_relative '../lib/wca_exceptions'
require_relative 'locales/locales'

require 'rails/all'

require_relative '../lib/monkeypatch_json_renderer_to_pretty_print'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)
ENVied.require(*ENV['ENVIED_GROUPS'] || Rails.groups)

module WcaOnRails
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true
    config.active_record.schema_format = :sql

    config.active_job.queue_adapter = :delayed_job

    config.generators do |g|
      g.test_framework :rspec,
        fixtures: true,
        view_specs: false,
        helper_specs: false,
        routing_specs: false,
        controller_specs: true,
        request_specs: true
      g.fixture_replacement :factory_girl, dir: "spec/factories"
    end

    config.default_from_address = "notifications@worldcubeassociation.org"
    config.site_name = "World Cube Association"

    config.middleware.insert_before 0, Rack::Cors, debug: false, logger: (-> { Rails.logger }) do
      allow do
        origins '*'

        resource '/api/*',
          headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
          methods: [:get, :post, :delete, :put, :patch, :options, :head],
          expose: ['Total', 'Per-Page', 'Link'],
          max_age: 0,
          credentials: false
      end
    end

    # Setup available locales
    I18n.available_locales = Locales::AVAILABLE.keys

    config.middleware.use Middlewares::FixAcceptHeader
    config.middleware.use Middlewares::WardenUserLogger, logger: ->(s) { Rails.logger.info(s) }

    config.autoload_paths << Rails.root.join('lib')
  end
end
