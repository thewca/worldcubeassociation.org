# frozen_string_literal: true

class DumpPublicResultsDatabase < ApplicationJob
  extend TimedApplicationJob

  include TimedApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform(force_export: false)
    # Create results database dump every day.
    if force_export || self.class.start_timestamp.not_after?(1.day.ago.end_of_hour)
      DbDumpHelper.dump_results_db
    end
  end
end
