# frozen_string_literal: true

class DumpDeveloperDatabase < ApplicationJob
  extend TimedApplicationJob

  include TimedApplicationJob
  include SingletonApplicationJob

  queue_as :default

  before_enqueue do |job|
    # Create developer database dump every 3 days.
    should_export = self.class.start_timestamp.not_after?(3.days.ago.end_of_hour)
    force_export = job.arguments.last&.fetch(:force_export, false)

    throw :abort unless should_export || force_export

    running_on_dev_dump = Timestamp.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)
    throw :abort if running_on_dev_dump
  end

  def perform
    DbDumpHelper.dump_developer_db
  end
end
