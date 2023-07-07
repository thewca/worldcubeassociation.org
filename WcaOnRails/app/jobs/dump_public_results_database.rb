# frozen_string_literal: true

class DumpPublicResultsDatabase < ApplicationJob
  def perform
    DbDumpHelper.dump_results_db
  end
end
