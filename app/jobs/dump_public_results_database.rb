# frozen_string_literal: true

class DumpPublicResultsDatabase < WcaCronjob
  def perform
    DbDumpHelper.dump_results_db self.class.start_date
  end
end
