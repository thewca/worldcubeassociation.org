# frozen_string_literal: true

class DumpPublicResultsDatabase < SingletonApplicationJob
  TIMESTAMP_NAME = 'public_results_dump'

  queue_as :default

  def perform(force_export: false)
    # Create results database dump every day.
    last_public_results_dump = Timestamp.find_or_create_by(name: TIMESTAMP_NAME)
    if force_export || last_public_results_dump.not_after?(24.hours.ago)
      Rake::Task["db:dump:public_results"].invoke

      last_public_results_dump.touch :date
      Rake::Task["db:dump:public_results"].reenable
    end
  end
end
