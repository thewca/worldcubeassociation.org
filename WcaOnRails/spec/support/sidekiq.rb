# frozen_string_literal: true

require 'middlewares/singleton_job_middleware'
require 'middlewares/statistics_tracking_middleware'
require 'middlewares/job_lifecycle_middleware'

Sidekiq::Testing.server_middleware do |chain|
  chain.add Middlewares::StatisticsTrackingMiddleware
  chain.add Middlewares::JobLifecycleMiddleware
end
