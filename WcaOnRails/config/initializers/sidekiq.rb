# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }

  # Run all queues except cronjobs in the default runner
  config.queues = %w[critical default mailers]

  # Our cronjobs generally react allergic to concurrency because we never designed them with idempotency in mind.
  # Instead of redesigning our whole zoo of cronjobs, pipe them through a linear execution worker.
  config.capsule("cronjobs") do |cap|
    cap.concurrency = 1
    cap.queues = [WcaCronjob::QUEUE_NAME]
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }
end
