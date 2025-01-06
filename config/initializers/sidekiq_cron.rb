# frozen_string_literal: true

Sidekiq::Cron.configure do |config|
  config.cron_poll_interval = EnvConfig.CRONJOB_POLLING_SECONDS
end
