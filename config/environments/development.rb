# frozen_string_literal: true

require 'active_support/core_ext/integer/time'

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.enable_reloading = true

  # Do not eager load code on boot.
  config.eager_load = false
  # We need this so docker compose works in dev
  config.hosts.clear
  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join('tmp', 'caching-dev.txt').exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true
    # If the Developer is not running through Docker, Redis caching is disabled
    cache_redis_url = EnvConfig.CACHE_REDIS_URL
    if cache_redis_url.empty?
      config.cache_store = :memory_store
    else
      config.cache_store = :redis_cache_store, { url: cache_redis_url }
    end
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.to_i}",
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # Setup for mailcatcher (http://mailcatcher.me/)
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = { address: EnvConfig.MAILCATCHER_SMTP_HOST, port: 1025 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Setup for ActiveStorage.
  config.active_storage.service = :local

  config.after_initialize do
    Bullet.enable = EnvConfig.ENABLE_BULLET?
    Bullet.alert = true
    Bullet.bullet_logger = true
    Bullet.console = true
    Bullet.rails_logger = true

    # See https://github.com/thewca/worldcubeassociation.org/pull/1452. This seems to be something
    # Bullet asks us to include, but isn't necessary, and including it causes a huge performance problem.
    Bullet.add_safelist type: :n_plus_one_query, class_name: 'Registration', association: :competition_events

    # When loading the edit events page for a competition, Bullet erroneously warns that we are
    # not using the rounds association.
    Bullet.add_safelist type: :unused_eager_loading, class_name: 'CompetitionEvent', association: :rounds
  end

  # uncomment this if you want to test error pages in development
  # config.consider_all_requests_local = false
  # config.exceptions_app = ->(env) {
  #   ErrorsController.action(:show).call(env)
  # }

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  # config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true

  # Whitelist any IPs when we're in Docker (meaning local dev environment)
  if File.file?('/proc/1/cgroup') && File.read('/proc/1/cgroup').include?('docker')
    config.web_console.whitelisted_ips = %w(0.0.0.0/0 ::/0)
  end
end
