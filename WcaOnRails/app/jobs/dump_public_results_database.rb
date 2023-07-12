# frozen_string_literal: true

class DumpPublicResultsDatabase < ApplicationJob
  extend TimedApplicationJob

  include TimedApplicationJob
  include SingletonApplicationJob

  queue_as :default

  before_enqueue do |job|
    # Create results database dump every day.
    should_export = self.class.start_timestamp.not_after?(1.day.ago.end_of_hour)
    force_export = job.arguments.last&.fetch(:force_export, false)

    throw :abort unless should_export || force_export
  end

  def perform(force_export: false)
    DbDumpHelper.dump_results_db
  end
end
