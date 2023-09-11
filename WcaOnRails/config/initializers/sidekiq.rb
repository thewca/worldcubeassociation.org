# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }
end

Sidekiq.configure_client do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }
end
