# frozen_string_literal: true

class DumpDeveloperDatabase < ApplicationJob
  extend TimedApplicationJob

  include TimedApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform(force_export: false)
    # Create developer database dump every 3 days.
    if force_export || self.start_timestamp.not_after?(3.days.ago.end_of_hour)
      running_on_dev_dump = Timestamp.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)

      unless running_on_dev_dump
        DbDumpHelper.dump_developer_db
      end
    end
  end
end
