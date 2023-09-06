# frozen_string_literal: true

require 'middlewares/job_reporting_middleware'

Sidekiq::Testing.server_middleware do |chain|
  chain.add Middlewares::JobReportingMiddleware
end
