# frozen_string_literal: true

module Middlewares
  class SingletonJobMiddleware
    include Sidekiq::ClientMiddleware

    # The Sidekiq middleware has to follow this method signature, even though some parameters may be unused.
    def call(job_class_or_string, job, queue, redis_pool)
      if queue.to_sym == WcaCronjob::QUEUE_NAME
        # Rails ActiveJob wraps the jobs in a very complicated fashion
        stat_key = job["wrapped"] || job_class_or_string
        statistics = CronjobStatistic.find_or_create_by(name: stat_key)

        # If a job has a start timestamp but no end timestamp, it is currently running
        if statistics.run_start.present? && !statistics.run_end.present?
          statistics.increment! :recently_rejected

          # Make Sidekiq abort and do NOT enqueue the job
          return false
        else
          statistics.touch :enqueued_at
          statistics.recently_rejected = 0

          statistics.save!
        end
      end

      yield
    end
  end
end
