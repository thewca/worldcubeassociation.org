# frozen_string_literal: true
require 'tempfile'
require 'rails_helper'
require 'database_dumper'

def with_database(db_name)
  old_connection_config = ActiveRecord::Base.connection_config
  begin
    ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{db_name}")
    ActiveRecord::Base.connection.execute("CREATE DATABASE #{db_name} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci")
    connection_config = old_connection_config.merge(database: db_name, connect_flags: Mysql2::Client::MULTI_STATEMENTS)
    ActiveRecord::Base.establish_connection(connection_config)
    yield
  ensure
    ActiveRecord::Base.establish_connection(old_connection_config)
    ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{db_name}")
  end
end

RSpec.describe "DatabaseDumper" do
  it "defines sanitizers for precisely the tables that exist" do
    expect(DatabaseDumper::TABLE_SANITIZERS.keys).to match_array ActiveRecord::Base.connection.data_sources
  end

  DatabaseDumper::TABLE_SANITIZERS.each do |table_name, table_sanitizer|
    it "defines a sanitizer of table '#{table_name}'" do
      unless table_sanitizer == :skip_all_rows
        where_clause = table_sanitizer[:where_clause]
        expect(where_clause).to_not be_nil
        column_sanitizers = table_sanitizer[:column_sanitizers]
        column_names = ActiveRecord::Base.connection.columns(table_name).map(&:name)
        expect(column_sanitizers.keys).to match_array(column_names)
      end
    end
  end

  # The default database cleaning method of transation does not work for this test
  # because we close and recreate our database connection inside of the test. Use
  # truncation so we don't leave a dirty database behind.
  it "dumps the database according to sanitizers", clean_db_with_truncation: true do
    not_visible_competition = FactoryGirl.create :competition, :not_visible, :with_delegate
    visible_competition = FactoryGirl.create :competition, :visible, remarks: "Super secret message to the Board"
    user = FactoryGirl.create :user, dob: Date.new(1989, 1, 1)

    dump_file = Tempfile.new
    DatabaseDumper.development_dump(dump_file.path)
    dump_file.rewind
    sql = dump_file.read
    dump_file.close

    with_database "wca_db_dump_test" do
      ActiveRecord::Base.connection.execute(sql)
      # We have to walk over all the results from the previous multistatement query
      # in order to wait for the entire query to finish.
      while ActiveRecord::Base.connection.raw_connection.next_result
      end
      ActiveRecord::Base.connection.reconnect!

      expect(Competition.count).to eq 1
      expect(visible_competition.reload.remarks).to eq "remarks to the board here"
      expect(CompetitionDelegate.find_by_competition_id(not_visible_competition.id)).to eq nil
      expect(user.reload.dob).to eq Date.new(1954, 12, 4)
    end
  end
end
