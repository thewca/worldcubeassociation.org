## From http://www.lshift.net/blog/2013/09/30/changing-the-primary-key-type-in-ruby-on-rails-models/

# NOTE: Rails does not allow other primary keys to be defined so we have
# to do it here

namespace :WcaOnRails do
  namespace :db do
    task :after_schema_load => :environment do
      # Sqlite does not support the ADD PRIMARY KEY command.
      unless ActiveRecord::Base.connection.instance_of?(ActiveRecord::ConnectionAdapters::SQLite3Adapter)
        ["Countries", "Continents", "Persons", "Events", "Rounds", "Formats", "Competitions"].each do |table|
          puts "Adding primary key for #{table}"
          query = "ALTER TABLE #{table} ADD PRIMARY KEY (id);"
          ActiveRecord::Base.connection.execute(query)
        end
      end
    end
  end
end

Rake::Task['db:schema:load'].enhance do
  ::Rake::Task['WcaOnRails:db:after_schema_load'].invoke
end
