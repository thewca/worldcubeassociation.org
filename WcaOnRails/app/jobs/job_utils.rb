# frozen_string_literal: true

module JobUtils
  # Add any new job you might create to this list, or tests will fail
  # (our seeds file has to know which jobs to seed statistics for
  #   and doing `ApplicationJob.subclasses` will not work because
  #   Rails uses lazy loading for non-production environments, including dev and test)
  WCA_CRONJOBS = [
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
end
