# frozen_string_literal: true

module Delayed
  module Plugins
    class SaveCompletedJobs < Delayed::Plugin
      callbacks do |lifecycle|
        lifecycle.around(:invoke_job) do |job, *args, &block|
          begin
            block.call(job, *args)
            Delayed::Plugins::SaveCompletedJobs.save_completed_job(job)
          rescue Exception => e # rubocop:disable Lint/RescueException
            JobFailureMailer.notify_admin_of_job_failure(job, e).deliver_now
            raise e
          end
        end
      end

      def self.save_completed_job(job)
        CompletedJob.create(
          priority: job.priority,
          attempts: job.attempts,
          handler: job.handler,
          run_at: job.run_at,
          queue: job.queue,
          completed_at: Time.now,
        )
      end
    end
  end
end
