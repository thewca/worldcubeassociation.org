# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  WCA_QUEUE = :wca_jobs

  # Add any new job you might create to this list, or tests will fail
  # (our seeds file has to know which jobs to seed statistics for
  #   and doing `ApplicationJob.subclasses` will not work because
  #   Rails uses lazy loading for non-production environments, including dev and test)
  WCA_JOBS = [
    CleanupPdfs,
    ClearConnectedStripeAccount,
    ClearTmpCache,
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

  queue_as WCA_QUEUE

  class << self
    def job_statistics
      JobStatistic.find_or_create_by!(name: self.name)
    end

    def start_date
      self.job_statistics.run_start
    end

    def end_date
      self.job_statistics.run_end
    end

    def in_progress?
      self.job_statistics.enqueued_at.present?
    end

    def finished?
      self.end_date.present?
    end
  end
end
