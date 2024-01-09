# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }

  # Run all queues except cronjobs in the default runner
  config.queues = %w[critical default mailers]
  # Three queues, three threads. We don't want to steal too much resources from Rails,
  #   especially regarding the DB connection pool which is limited to 5 resources by default
  config.concurrency = 3

  # Our cronjobs generally react allergic to concurrency because we never designed them with idempotency in mind.
  # Instead of redesigning our whole zoo of cronjobs, pipe them through a linear execution worker.
  config.capsule("cronjobs") do |cap|
    cap.concurrency = 1
    cap.queues = %w[wca_jobs]
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: EnvConfig.SIDEKIQ_REDIS_URL }
end

# Make sure that job inserts during transaction are only inserted when the transaction completes.
Sidekiq.transactional_push!
