# frozen_string_literal: true

module Middlewares
  class StatisticsTrackingMiddleware
    include Sidekiq::ServerMiddleware

    # The Sidekiq middleware has to follow this method signature, even though some parameters may be unused.
    def call(job_instance, job_payload, queue)
      job_class = job_payload["wrapped"] || job_payload["class"]

      # Note that we DON'T use find_or_create_by here, because we need the variable on top-level
      # (to access before _and_ after yield) but there are jobs that we don't want to compute statistics for
      statistics = JobStatistic.find_by name: job_class

      if queue.to_sym == ApplicationJob::WCA_QUEUE && statistics.present?
        statistics.touch :run_start
      end

      run_successful = true
      error_message = nil

      begin
        yield
      rescue => e # rubocop:disable Style/RescueStandardError
        run_successful = false
        error_message = e.message

        # Propagate the error so that sidekiq can do retry-handling
        raise e
      ensure
        if queue.to_sym == ApplicationJob::WCA_QUEUE && statistics.present?
          statistics.touch :run_end

          statistics.enqueued_at = nil

          statistics.last_run_successful = run_successful
          statistics.last_error_message = error_message

          if run_successful
            statistics.increment :times_completed

            runtime = (statistics.run_end - statistics.run_start).in_milliseconds

            current_average = statistics.average_runtime || 0
            new_average = (current_average + runtime.round) / statistics.times_completed

            statistics.average_runtime = new_average
          else
            statistics.increment :recently_errored
          end

          statistics.save!
        end
      end
    end
  end
end
