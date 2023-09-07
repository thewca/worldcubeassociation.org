# frozen_string_literal: true

require_relative '../../lib/middlewares/job_reporting_middleware'

Sidekiq.configure_server do |config|
  config.redis = { url: EnvVars.SIDEKIQ_REDIS_URL }

  config.server_middleware do |chain|
    chain.add Middlewares::JobReportingMiddleware
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: EnvVars.SIDEKIQ_REDIS_URL }
end
