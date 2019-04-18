# frozen_string_literal: true

namespace :work do
  desc 'Schedule work to be done'
  task schedule: :environment do
    SubmitResultsNagJob.perform_later
    SubmitReportNagJob.perform_later
    ComputeLinkings.perform_later
    DumpDeveloperDatabase.perform_later
    # NOTE: we want to only do this on the actual "production" server, as we need the real users' emails.
    SyncMailingListsJob.perform_later if ENVied.WCA_LIVE_SITE
  end
end
