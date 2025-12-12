# frozen_string_literal: true

require_relative 'boot'
require_relative 'locales/locales'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)
require_relative '../env_config'
require_relative '../app_secrets'

# Production default for configuring Rails cryptographic base key,
# which is necessary because `config.secret_key_base=` only works in local environments.
ENV["SECRET_KEY_BASE"] ||= AppSecrets.SECRET_KEY_BASE

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

    # secret_key_base is an important cryptographic key that lots of other Rails procedures (cookies, signatures, etc.)
    # are based on. Rails desperately wants you to set it through `credentials.yml.enc` but GB desperately doesn't want
    # to check in credentials to git (no matter whether their encryption is strong or not)
    config.secret_key_base = AppSecrets.SECRET_KEY_BASE

    config.load_defaults 8.1

    # Force belongs_to validations even on empty/unset keys.
    #   This is potentially a Rails bug (?!?) and has been reported at https://github.com/rails/rails/issues/52614
    config.active_record.belongs_to_required_validates_foreign_key = true

    # Make sure we can decrypt data that was encrypted before Rails 7.1
    #   God only knows why Rails decided to make the backwards-INCOMPATIBLE `false` their upgrade default
    config.active_record.encryption.support_sha1_for_non_deterministic_encryption = true

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
    config.site_name = if EnvConfig.API_ONLY?
                         "World Cube Association API"
                       else
                         "World Cube Association"
                       end

    # Setup available locales
    I18n.available_locales = Locales::AVAILABLE.keys

    # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
    # the I18n.default_locale when a translation cannot be found).
    config.i18n.fallbacks = [:en]

    config.autoload_paths << Rails.root.join('lib')
    config.eager_load_paths << Rails.root.join('lib')

    # Set global default_url_options, see https://github.com/rails/rails/issues/29992#issuecomment-761892658
    root_url = URI.parse(EnvConfig.ROOT_URL)
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
    config.active_record.encryption.primary_key = AppSecrets.ACTIVERECORD_PRIMARY_KEY
    config.active_record.encryption.deterministic_key = AppSecrets.ACTIVERECORD_DETERMINISTIC_KEY
    config.active_record.encryption.key_derivation_salt = AppSecrets.ACTIVERECORD_KEY_DERIVATION_SALT
  end
end
