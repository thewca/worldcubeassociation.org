# frozen_string_literal: true

require_relative 'boot'
require_relative 'locales/locales'
require_relative '../lib/middlewares/fix_accept_header'
require_relative '../lib/middlewares/warden_user_logger'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)
require_relative '../env_vars'
require_relative '../config/initializers/_vault'

module WcaOnRails
  BOOTED_AT = Time.now

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

    config.load_defaults 7.0

    config.active_job.queue_adapter = :sidekiq

    config.generators do |g|
      g.test_framework(
        :rspec,
        fixtures: true,
        view_specs: false,
        helper_specs: false,
        routing_specs: false,
        controller_specs: true,
        request_specs: true,
      )
      g.fixture_replacement :factory_girl, dir: "spec/factories"
    end

    config.default_from_address = "notifications@worldcubeassociation.org"
    config.site_name = "World Cube Association"

    config.middleware.insert_before 0, Rack::Cors, debug: false, logger: (-> { Rails.logger }) do
      allow do
        origins '*'

        resource(
          '/api/*',
          headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
          methods: [:get, :post, :delete, :put, :patch, :options, :head],
          expose: ['Total', 'Per-Page', 'Link'],
          max_age: 0,
          credentials: false,
        )
      end
    end

    # Setup available locales
    I18n.available_locales = Locales::AVAILABLE.keys

    # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
    # the I18n.default_locale when a translation cannot be found).
    config.i18n.fallbacks = [:en]

    config.middleware.use Middlewares::FixAcceptHeader
    config.middleware.use Middlewares::WardenUserLogger, logger: ->(s) { Rails.logger.info(s) }

    config.autoload_paths << Rails.root.join('lib')
    config.eager_load_paths << Rails.root.join('lib')

    # Set global default_url_options, see https://github.com/rails/rails/issues/29992#issuecomment-761892658
    root_url = URI.parse(EnvVars.ROOT_URL)
    routes.default_url_options = {
      protocol: root_url.scheme,
      host: root_url.host,
      port: root_url.port,
    }

    config.action_view.preload_links_header = false
    config.active_storage.variant_processor = :mini_magick

    # Move the mailers into a separate queue for us to control
    config.action_mailer.deliver_later_queue_name = :mailers

    # Activate ActiveRecord attribute encryption for use with the Devise 2FA gem
    config.active_record.encryption.primary_key = read_secret("ACTIVERECORD_PRIMARY_KEY")
    config.active_record.encryption.deterministic_key = read_secret("ACTIVERECORD_DETERMINISTIC_KEY")
    config.active_record.encryption.key_derivation_salt = read_secret("ACTIVERECORD_KEY_DERIVATION_SALT")
  end
end
