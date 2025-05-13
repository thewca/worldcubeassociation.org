# frozen_string_literal: true

class CronjobWarningJob < WcaCronjob
  def perform
    scheduled_jobs = Sidekiq::Cron::Job.all

    scheduled_jobs.each do |job|
      next if job.klass == self.class

      statistics = CronjobStatistic.find_by(name: job.klass)
      next if statistics.nil? || statistics.average_runtime.nil?

      # Normally, we would warn if the last run (w.r.t the execution time of the cronjob you're looking at right now)
      #   has not been scheduled yet. However, since we execute jobs in a linear queue, some long-running jobs
      #   (like the DumpDeveloperDatabase job) might "delay" super fast-running jobs (like the CleanupPdfs job).
      # When that happens, there is nothing to immediately worry about. To avoid unnecessary warning messages
      #   that turn out to be false positives, we use the previous-last run as a marker time instead.
      last_scheduled_run = job.last_time
      should_have_run_scheduled = job.last_time last_scheduled_run

      average_runtime = (statistics.average_runtime / 1000.0).seconds
      should_start_before = should_have_run_scheduled + (3 * average_runtime)

      started_as_planned = statistics.run_start <= should_start_before
      completed_later_successfully = statistics.successful_run_start >= should_start_before

      unless started_as_planned || completed_later_successfully
        message = if statistics.last_run_successful?
                    <<~SLACK.squish
                      Uh oh! Cronjob '#{job.klass}' should have run at #{should_start_before}
                      (with leeway at an average runtime of #{average_runtime} seconds)
                      but still hasn't started. Please check that everything is in order!"
                    SLACK
                  else
                    <<~SLACK.squish
                      BEEP BOOP :alarm: Cronjob '#{job.klass}' should have run at #{should_start_before}
                      but it previously crashed with the following error message:

                      ```
                      #{statistics.last_error_message}
                      ```
                    SLACK
                  end

        if Rails.env.production? && EnvConfig.WCA_LIVE_SITE?
          SlackBot.send_alarm_message(message)
        else
          Rails.logger.warn message
        end
      end
    end
  end
end
