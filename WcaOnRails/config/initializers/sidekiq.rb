# frozen_string_literal: true

require_relative '../../lib/middlewares/singleton_job_middleware'
require_relative '../../lib/middlewares/statistics_tracking_middleware'
require_relative '../../lib/middlewares/job_lifecycle_middleware'

Sidekiq.configure_server do |config|
  config.client_middleware do |chain|
    chain.add Middlewares::SingletonJobMiddleware
  end

  config.server_middleware do |chain|
    chain.add Middlewares::StatisticsTrackingMiddleware
    chain.add Middlewares::JobLifecycleMiddleware
  end
end

Sidekiq.configure_client do |config|
  config.client_middleware do |chain|
    chain.add Middlewares::SingletonJobMiddleware
  end
end
