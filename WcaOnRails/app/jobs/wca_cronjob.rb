# frozen_string_literal: true

class WcaCronjob < ApplicationJob
  QUEUE_NAME = :wca_jobs

  # Add any new job you might create to this list, or tests will fail
  # (our seeds file has to know which jobs to seed statistics for
  #   and doing `ApplicationJob.subclasses` will not work because
  #   Rails uses lazy loading for non-production environments, including dev and test)
  ALL_JOBS = [
    CleanupPdfs,
    ClearConnectedStripeAccount,
    ComputeAuxiliaryData,
    DumpDeveloperDatabase,
    DumpPublicResultsDatabase,
    GenerateChore,
    RegistrationReminderJob,
    SubmitReportNagJob,
    SubmitResultsNagJob,
    SyncMailingListsJob,
    UnstickPosts,
    WeatMonthlyDigestJob,
  ].freeze

  queue_as QUEUE_NAME

  # Middleware: Don't enqueue cronjobs that are already running
  before_enqueue do |job|
    statistics = job.class.cronjob_statistics

    # If a job has a start timestamp but no end timestamp, it is currently running
    if statistics.run_start.present? && !statistics.run_end.present?
      statistics.increment! :recently_rejected

      # Make Sidekiq abort and do NOT enqueue the job
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

    run_successful = true
    error_message = nil

    begin
      block.call
    rescue => e # rubocop:disable Style/RescueStandardError
      run_successful = false
      error_message = e.message

      # Propagate the error so that our job adapter can do retry-handling
      raise e
    ensure
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

  class << self
    def cronjob_statistics
      CronjobStatistic.find_or_create_by!(name: self.name)
    end

    def start_date
      self.cronjob_statistics.run_start
    end

    def end_date
      self.cronjob_statistics.run_end
    end

    def in_progress?
      self.cronjob_statistics.enqueued_at.present?
    end

    def finished?
      self.end_date.present?
    end
  end
end
