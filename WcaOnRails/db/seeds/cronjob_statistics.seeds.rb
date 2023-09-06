# frozen_string_literal: true

WcaCronjob::ALL_JOBS.each do |job_class|
  # For tests, we run a lot of jobs (especially mailers!) in the background
  # which try to `find_or_create_by` their backing statistics on first run.
  # This is problematic because most tests run in a read-only environment, so we init dummy statistics.
  job_class.cronjob_statistics.save!
end
