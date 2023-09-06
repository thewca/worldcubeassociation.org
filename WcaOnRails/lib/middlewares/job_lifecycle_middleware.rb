# frozen_string_literal: true

module Middlewares
  class JobLifecycleMiddleware
    include Sidekiq::ServerMiddleware

    # The Sidekiq middleware has to follow this method signature, even though some parameters may be unused.
    def call(job_instance, job_payload, queue)
      yield
    rescue => e # rubocop:disable Style/RescueStandardError
      JobFailureMailer.notify_admin_of_job_failure(job_payload, e).deliver_now

      # Propagate the error so that sidekiq can do retry-handling
      raise e
    end
  end
end
