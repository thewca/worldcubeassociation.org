# frozen_string_literal: true

class WcaCronjob < ApplicationJob
  QUEUE_NAME = :wca_jobs

  queue_as QUEUE_NAME

  # Middleware: Check queue status of cronjob. Record timestamp if it's being enqueued,
  #   or reject it if it has already been enqueued previously
  before_enqueue do |job|
    statistics = job.class.cronjob_statistics

    if statistics.scheduled? || statistics.in_progress? || statistics.recently_errored?
      statistics.increment! :recently_rejected

      # Make ActiveJob abort and do NOT enqueue the job
      throw :abort
    else
      # Note to avid readers: Everything in this else-block would make more sense in an after_enqueue hook.
      #   But doing so creates a race condition where jobs can be enqueued and then IMMEDIATELY be picked up
      #   by the job handler backend before after_enqueue even had time to fire. This can be problematic,
      #   for example if after_enqueue sets the "locked_at" timestamp after the job has already been picked up
      #   and finished (happens for very quick jobs like a nag_job that realizes there's nothing to nag).
      statistics.touch :enqueued_at
      statistics.recently_rejected = 0
    end

    statistics.save!
  end

  # Middleware: Record when and how long a cronjob was executed
  #   (or, if applicable, record that it was not executed)
  around_perform do |job, block|
    statistics = job.class.cronjob_statistics

    statistics.touch :run_start

    statistics.run_end = nil
    statistics.enqueued_at = nil

    statistics.save!

    run_successful = true
    error_message = nil

    begin
      block.call
    rescue => e # rubocop:disable Style/RescueStandardError
      run_successful = false
      error_message = e.message

      # Inform WST about the error so we can investigate and take action if required
      JobFailureMailer.notify_admin_of_job_failure(job, e).deliver_now

      # We don't have clever mechanisms like Mailcatcher for mocking emails in non-prod
      # environments, so for Slack we just do a hard production check instead. Shout if you have better ideas!
      if Rails.env.production? && EnvConfig.WCA_LIVE_SITE?
        failure_message = "Job #{job.class} (Sidekiq ID #{job.provider_job_id}) failed"
        SlackBot.send_error_report(failure_message, e)
      end

      # Propagate the error so that our job adapter can do retry-handling
      raise e
    ensure
      statistics.touch :run_end

      statistics.last_run_successful = run_successful
      statistics.last_error_message = error_message

      if run_successful
        statistics.increment :times_completed

        # Record that this run was successful. In the event of a crash, we record that the CJ started and then crashed
        #   but there are use cases where we want to know when it started AND completed successfully.
        statistics.successful_run_start = statistics.run_start

        runtime = (statistics.run_end - statistics.run_start).in_milliseconds

        current_average = statistics.average_runtime || 0
        new_average = (current_average + runtime.round) / statistics.times_completed

        statistics.average_runtime = new_average
        statistics.recently_errored = 0
      else
        statistics.increment :recently_errored
      end

      statistics.save!
    end
  end

  class << self
    delegate :in_progress?, :scheduled?, :enqueued_at, :finished?, :last_run_successful?, :last_error_message, :recently_errored?, to: :cronjob_statistics

    def cronjob_statistics
      CronjobStatistic.find_or_create_by!(name: self.name)
    end

    def start_date
      self.cronjob_statistics.run_start
    end

    def end_date
      self.cronjob_statistics.run_end
    end

    def successful_start_date
      self.cronjob_statistics.successful_run_start
    end

    def reset_error_state!
      self.cronjob_statistics.update!(
        run_start: nil,
        run_end: nil,
        recently_errored: 0,
        last_error_message: nil,
      )
    end

    def serialize
      {
        in_progress: self.in_progress?,
        scheduled: self.scheduled?,
        enqueued_at: self.enqueued_at,
        finished: self.finished?,
        last_run_successful: self.last_run_successful?,
        last_error_message: self.last_error_message,
        recently_errored: self.recently_errored?,
        start_date: self.start_date,
        end_date: self.end_date,
        cronjob_statistics: cronjob_statistics,
        reason_not_to_run: self.try(:reason_not_to_run),
      }
    end
  end
end
