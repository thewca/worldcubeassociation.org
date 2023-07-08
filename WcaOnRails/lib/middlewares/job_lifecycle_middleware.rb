# frozen_string_literal: true

module Middlewares
  class JobLifecycleMiddleware
    include Sidekiq::ServerMiddleware

    def call(job_instance, job_payload, queue)
      run_succesful = true

      begin
        yield
      rescue => e # rubocop:disable Style/RescueStandardError
        JobFailureMailer.notify_admin_of_job_failure(job_payload, e).deliver_now
        run_succesful = false

        # Propagate the error so that sidekiq can do retry-handling
        raise e
      ensure
        if run_succesful
          CompletedJob.create!(
            priority: 0,
            attempts: job_payload["retry_count"] || 0,
            handler: job_payload["args"].to_json,
            run_at: Time.at(job_payload["created_at"]),
            queue: job_payload["queue"],
            completed_at: Time.now,
          )
        end
      end
    end
  end
end
