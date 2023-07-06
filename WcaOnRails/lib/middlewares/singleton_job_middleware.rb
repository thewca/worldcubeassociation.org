# frozen_string_literal: true

module Middlewares
  class SingletonJobMiddleware
    include Sidekiq::ClientMiddleware

    def call(job_class_or_string, job, queue, redis_pool)
      if queue.to_sym == ApplicationJob::WCA_QUEUE
        # Rails ActiveJob wraps the jobs in a very complicated fashion
        stat_key = job["wrapped"] || job_class_or_string
        statistics = JobStatistic.find_or_create_by(name: stat_key)

        if statistics.enqueued_at.present?
          statistics.increment! :recently_rejected
          return false
        else
          statistics.touch :enqueued_at
          statistics.recently_rejected = 0
          statistics.run_end = nil

          statistics.save!
        end
      end

      yield
    end
  end
end
