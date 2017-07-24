# frozen_string_literal: true

class DumpDeveloperDatabase < ApplicationJob
  queue_as :default

  def perform
    # Create developer database dump every 3 days.
    last_developer_db_dump = Timestamp.find_or_create_by(name: 'developer_db_dump')
    if last_developer_db_dump.not_after?(3.days.ago)
      Rake::Task["db:dump:development"].invoke
      last_developer_db_dump.touch :date
    end
  end
end
