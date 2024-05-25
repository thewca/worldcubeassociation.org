# frozen_string_literal: true

class DumpPublicResultsDatabase < WcaCronjob
  before_enqueue do
    running_on_dev_dump = ServerSetting.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)
    throw :abort if running_on_dev_dump
  end

  def perform
    DbDumpHelper.dump_results_db self.class.start_date
  end
end
