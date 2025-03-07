# frozen_string_literal: true

module JobUtils
  # Add any new job you might create to this list, or tests will fail
  # (our seeds file has to know which jobs to seed statistics for
  #   and doing `ApplicationJob.subclasses` will not work because
  #   Rails uses lazy loading for non-production environments, including dev and test)
  WCA_CRONJOBS = [
    CleanupPdfs,
    ClearConnectedPaymentIntegrations,
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
    DelegatesMetadataSyncJob,
  ].freeze

  WCA_CRONJOBS_MAP = WCA_CRONJOBS.to_h { |job| [job.name, job] }

  def self.cronjob_statistics_from_cronjob_name(cronjob_name)
    WCA_CRONJOBS_MAP[cronjob_name]&.cronjob_statistics
  end

  def self.run_cronjob(cronjob_name)
    cronjob = WCA_CRONJOBS_MAP[cronjob_name]

    raise WcaExceptions::NotPermitted.new("Cannot run cronjob: #{cronjob.reason_not_to_run}") if cronjob.try(:reason_not_to_run).present?

    cronjob.perform_later
  end

  def self.reset_cronjob(cronjob_name)
    cronjob = WCA_CRONJOBS_MAP[cronjob_name]
    cronjob.reset_error_state!
  end
end
