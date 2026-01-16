# frozen_string_literal: true

class DumpPublicResultsDatabase < WcaCronjob
  before_enqueue do
    running_on_dev_dump = ServerSetting.exists?(name: DatabaseDumper::DEV_TIMESTAMP_NAME)
    throw :abort if running_on_dev_dump && Rails.env.production?
  end

  def perform
    DatabaseDumper.results_export_live_versions.each do |v|
      DbDumpHelper.dump_results_db(v, self.class.start_date)
    end
  end
end
