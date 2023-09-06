# frozen_string_literal: true

require_relative '../../lib/middlewares/job_reporting_middleware'

Sidekiq.configure_server do |config|
  config.server_middleware do |chain|
    chain.add Middlewares::JobReportingMiddleware
  end
end
