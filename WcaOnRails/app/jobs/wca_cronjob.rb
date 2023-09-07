# frozen_string_literal: true

class WcaCronjob < ApplicationJob
  QUEUE_NAME = :wca_jobs

  queue_as QUEUE_NAME

  # Middleware: Don't enqueue cronjobs that are already running
  before_enqueue do |job|
    statistics = job.class.cronjob_statistics

    if statistics.scheduled? || statistics.in_progress? || statistics.recently_errored > 0
      statistics.increment! :recently_rejected

      # Make ActiveJob abort and do NOT enqueue the job
      throw :abort
    end
  end

  # Middleware: Record when a cronjob was enqueued
  after_enqueue do |job|
    statistics = job.class.cronjob_statistics

    statistics.touch :enqueued_at
    statistics.recently_rejected = 0

    statistics.save!
  end

  # Middleware: Record when and how long a cronjob was executed
  #   (or, if applicable, record that it was not executed)
  around_perform do |job, block|
    statistics = job.class.cronjob_statistics

    statistics.touch :run_start
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

      # Propagate the error so that our job adapter can do retry-handling
      raise e
    ensure
      statistics.touch :run_end

      statistics.last_run_successful = run_successful
      statistics.last_error_message = error_message

      if run_successful
        statistics.increment :times_completed

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
    delegate :in_progress?, :scheduled?, :finished?, :last_run_successful?, to: :cronjob_statistics

    def cronjob_statistics
      CronjobStatistic.find_or_create_by!(name: self.name)
    end

    def start_date
      self.cronjob_statistics.run_start
    end

    def end_date
      self.cronjob_statistics.run_end
    end
  end
end
