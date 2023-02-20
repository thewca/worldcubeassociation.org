# frozen_string_literal: true

class DumpPublicResultsDatabase < SingletonApplicationJob
  queue_as :default

  def perform
    # Create developer database dump every 3 days.
    last_public_results_dump = Timestamp.find_or_create_by(name: 'public_results_dump')
    if last_public_results_dump.not_after?(3.days.ago)
      Rake::Task["db:dump:public_results"].invoke
      last_public_results_dump.touch :date
    end
  end
end
