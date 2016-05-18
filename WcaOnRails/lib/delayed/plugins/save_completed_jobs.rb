module Delayed
  module Plugins
    class SaveCompletedJobs < Delayed::Plugin
      callbacks do |lifecycle|
        lifecycle.around(:invoke_job) do |job, *args, &block|
          block.call(job, *args)
          Delayed::Plugins::SaveCompletedJobs.save_completed_job(job)
        end
      end

      def self.save_completed_job(job)
        CompletedJob.create({
          priority: job.priority,
          attempts: job.attempts,
          handler: job.handler,
          run_at: job.run_at,
          queue: job.queue,
          completed_at: DateTime.now,
        })
      end
    end
  end
end
