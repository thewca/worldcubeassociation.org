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
