# frozen_string_literal: true

class CronjobWarningJob < WcaCronjob
  def perform
    scheduled_jobs = Sidekiq::Cron::Job.all

    scheduled_jobs.each do |job|
      next if job.klass == self.class

      statistics = CronjobStatistic.find_by(name: job.klass)
      next if statistics.nil? || statistics.average_runtime.nil?

      last_scheduled_run = job.last_time

      average_runtime = (statistics.average_runtime / 1000.0).seconds
      should_start_before = last_scheduled_run + (3 * average_runtime)

      started_as_planned = (last_scheduled_run..should_start_before).cover? statistics.run_start

      unless started_as_planned
        message = if statistics.last_run_successful?
                    <<~SLACK.squish
                      Uh oh! Cronjob '#{job.klass}' should have run at #{last_scheduled_run}
                      (with leeway until #{should_start_before} at an average runtime of #{average_runtime} seconds)
                      but still hasn't started. Please check that everything is in order!"
                    SLACK
                  else
                    <<~SLACK.squish
                      BEEP BOOP :alarm: Cronjob '#{job.klass}' should have run at #{last_scheduled_run}
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
