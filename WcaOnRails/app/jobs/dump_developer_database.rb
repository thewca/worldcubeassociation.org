# frozen_string_literal: true

class DumpDeveloperDatabase < WcaCronjob
  before_enqueue do
    running_on_dev_dump = Timestamp.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)
    throw :abort if running_on_dev_dump
  end

  def perform
    DbDumpHelper.dump_developer_db
  end
end
