# frozen_string_literal: true

class DumpPublicResultsDatabase < WcaCronjob
  def perform
    DbDumpHelper.dump_results_db
  end
end
