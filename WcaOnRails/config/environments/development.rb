# frozen_string_literal: true

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  if Rails.root.join('tmp/caching-dev.txt').exist?
    config.action_controller.perform_caching = true

    config.cache_store = :memory_store
    config.public_file_server.headers = {
      'Cache-Control' => 'public, max-age=172800',
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false
  root_url = EnvVars.ROOT_URL
  unless root_url.present?
    root_url = "http://localhost:3000"
  end
  root_url = URI.parse(root_url)
  config.action_mailer.default_url_options = {
    protocol: root_url.scheme,
    host: root_url.host,
    port: root_url.port,
  }

  config.action_mailer.perform_caching = false

  # Setup for mailcatcher (http://mailcatcher.me/)
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = { address: 'localhost', port: 1025 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Setup for ActiveStorage.
  config.active_storage.service = :local

  config.after_initialize do
    Bullet.enable = !EnvVars.DISABLE_BULLET?
    Bullet.alert = true
    Bullet.bullet_logger = true
    Bullet.console = true
    Bullet.rails_logger = true

    # See https://github.com/thewca/worldcubeassociation.org/pull/1452. This seems to be something
    # Bullet asks us to include, but isn't necessary, and including it causes a huge performance problem.
    Bullet.add_whitelist type: :n_plus_one_query, class_name: "Registration", association: :competition_events

    # When loading the edit events page for a competition, Bullet erroneously warns that we are
    # not using the rounds association.
    Bullet.add_whitelist type: :unused_eager_loading, class_name: "CompetitionEvent", association: :rounds
  end

  # Add i18n-js to the middleware
  # We already run i18n:js:export when using webpack(-dev-server), but it wouldn't
  # get ran if using only bin/rails s
  config.middleware.use I18n::JS::Middleware

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  # config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # Whitelist any IPs when we're in Docker (meaning local dev environment)
  if File.file?('/proc/1/cgroup') && File.read('/proc/1/cgroup').include?('docker')
    config.web_console.whitelisted_ips = %w(0.0.0.0/0 ::/0)
  end
end
