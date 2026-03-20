# frozen_string_literal: true

class CronjobWarningJob < WcaCronjob
  def perform
    scheduled_jobs = Sidekiq::Cron::Job.all

    scheduled_jobs.each do |job|
      next if job.klass == self.class.name

      statistics = CronjobStatistic.find_by(name: job.klass)
      next if statistics.nil? || statistics.average_runtime.nil?

      last_scheduled_run = job.last_time

      # Normally, we would warn if the last run (w.r.t the execution time of the cronjob you're looking at right now)
      #   has not been scheduled yet. However, since we execute jobs in a linear queue, some long-running jobs
      #   (like the DumpDeveloperDatabase job) might "delay" super fast-running jobs (like the CleanupPdfs job).
      # For jobs that run "more than once per day", we avoid unnecessary warning messages
      #   that turn out to be false positives, by using the previous-last run as a marker time instead.
      last_scheduled_run = job.last_time(last_scheduled_run) if last_scheduled_run > 1.day.ago

      average_runtime = (statistics.average_runtime / 1000.0).seconds
      should_start_before = last_scheduled_run + (3 * average_runtime)

      started_as_planned = statistics.run_start&.between?(last_scheduled_run, should_start_before)
      completed_later_successfully = statistics.successful_run_start >= should_start_before
      running_extremely_long = !statistics.run_end? && statistics.run_start <= (5 * average_runtime).ago

      next if (started_as_planned && !running_extremely_long) || completed_later_successfully

      message = if running_extremely_long
                  <<~SLACK.squish
                    Kaboom! :boom: Cronjob '#{job.klass}' has started at #{statistics.run_start}
                    but still hasn't finished, despite running longer than five times the average
                    (#{average_runtime} seconds). Please check that everything is in order!"
                  SLACK
                elsif statistics.last_run_successful?
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
