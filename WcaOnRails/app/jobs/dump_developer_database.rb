# frozen_string_literal: true

class DumpDeveloperDatabase < SingletonApplicationJob
  queue_as :default

  def perform(force_export: false)
    # Create developer database dump every 3 days.
    last_developer_db_dump = Timestamp.find_or_create_by(name: 'developer_db_dump')
    if force_export || last_developer_db_dump.not_after?(3.days.ago)
      running_on_dev_dump = Timestamp.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)

      unless running_on_dev_dump
        DbDumpHelper.dump_developer_db
        last_developer_db_dump.touch :date
      end
    end
  end
end
