# frozen_string_literal: true

require 'tempfile'
require 'rails_helper'
require 'database_dumper'

def with_database(db_config_name)
  current_db_config = ActiveRecord::Base.connection_db_config
  desired_config = ActiveRecord::Base.configurations.configs_for(name: db_config_name.to_s, include_hidden: true)

  begin
    ActiveRecord::Tasks::DatabaseTasks.drop desired_config
    ActiveRecord::Tasks::DatabaseTasks.create desired_config
    ActiveRecord::Tasks::DatabaseTasks.load_schema desired_config

    yield
  ensure
    ActiveRecord::Tasks::DatabaseTasks.drop desired_config

    # Need to connect to primary database again
    ActiveRecord::Base.establish_connection(current_db_config) if current_db_config
  end
end

RSpec.describe "DatabaseDumper" do
  it "defines sanitizers for precisely the tables that exist" do
    expect(DatabaseDumper::DEV_SANITIZERS.keys).to match_array ActiveRecord::Base.connection.data_sources
  end

  DatabaseDumper::DEV_SANITIZERS.each do |table_name, table_sanitizer|
    it "defines a sanitizer of table '#{table_name}'" do
      unless table_sanitizer == :skip_all_rows
        where_clause = table_sanitizer[:where_clause]
        expect(where_clause).to be_nil.or(match(/WHERE/)).or(match(/JOIN/))
        where_clause = table_sanitizer[:order_by_clause]
        expect(where_clause).to be_nil.or(match(/ORDER BY/))
        column_sanitizers = table_sanitizer[:column_sanitizers]
        column_names = ActiveRecord::Base.connection.columns(table_name).map(&:name)
        expect(column_sanitizers.keys).to match_array(column_names)
      end
    end
  end

  # The default database cleaning method of transation does not work well when it comes to creating tables,
  # which is what we do in this test. Use truncation so we don't leave a dirty database behind.
  it "dumps the database according to sanitizers", :clean_db_with_truncation do
    not_visible_competition = create(:competition, :not_visible, :with_delegate)
    visible_competition = create(:competition, :visible, remarks: "Super secret message to the Board")
    user = create(:user, dob: Date.new(1989, 1, 1))
    create(:user, :banned)

    dump_file = Tempfile.new
    before_dump = Time.now.change(usec: 0) # Truncate the sub second part of the datetime, since mysql only stores 1 second granularity.
    DatabaseDumper.development_dump(dump_file.path)
    dump_file.rewind
    sql = dump_file.read
    dump_file.close

    with_database :developer_dump do
      expect(ServerSetting.find_by(name: DatabaseDumper::DEV_TIMESTAMP_NAME)).to be_nil

      DbHelper.execute_sql sql

      expect(Competition.count).to eq 1
      expect(visible_competition.reload.remarks).to eq "remarks to the board here"
      expect(CompetitionDelegate.find_by(competition_id: not_visible_competition.id)).to be_nil
      expect(user.reload.dob).to eq Date.new(1954, 12, 4)
      expect(ServerSetting.find_by(name: DatabaseDumper::DEV_TIMESTAMP_NAME).as_datetime).to be >= before_dump

      # It's ok for the public to know about the existence of a hidden group,
      # but we don't want them to know about the *members* of that hidden group.
      banned_group = UserGroup.banned_competitors_group
      expect(banned_group).not_to be_nil
      expect(banned_group.roles).to be_empty
    end
  end

  context "Results Export" do
    context 'v1' do
      it "defines sanitizers that match the expected output schema (backwards compatibility)" do
        with_database :results_dump do
          # Rails *always* includes a `schema_migrations` table when loading any pre-defined schema file.
          #   You can _change_ the name in the database configuration file, but you cannot turn it off / disable the table entirely.
          #   But since we don't care about Rails-ian specifics in our Results Export, we manually skip the table here.
          actual_table_names = ActiveRecord::Base.connection.data_sources - ["schema_migrations"]

          expect(DatabaseDumper::RESULTS_SANITIZERS.keys).to match_array actual_table_names
        end
      end

      DatabaseDumper::RESULTS_SANITIZERS.each do |table_name, table_sanitizer|
        it "defines a sanitizer of table '#{table_name}'" do
          unless table_sanitizer == :skip_all_rows
            where_clause = table_sanitizer[:where_clause]
            expect(where_clause).to be_nil.or(match(/WHERE/)).or(match(/JOIN/))
            where_clause = table_sanitizer[:order_by_clause]
            expect(where_clause).to be_nil.or(match(/ORDER BY/))
            column_sanitizers = table_sanitizer[:column_sanitizers]
            column_names = with_database(:results_dump) { ActiveRecord::Base.connection.columns(table_name).map(&:name) }
            expect(column_sanitizers.keys).to match_array(column_names)
          end
        end
      end
    end

    context 'v2', :zxc do
      it "defines sanitizers that match the expected output schema (backwards compatibility)" do
        with_database :results_dump_v2 do
          # Rails *always* includes a `schema_migrations` table when loading any pre-defined schema file.
          #   You can _change_ the name in the database configuration file, but you cannot turn it off / disable the table entirely.
          #   But since we don't care about Rails-ian specifics in our Results Export, we manually skip the table here.
          actual_table_names = ActiveRecord::Base.connection.data_sources - ["schema_migrations"]

          expect(DatabaseDumper::V2_RESULTS_SANITIZERS.keys).to match_array actual_table_names
        end
      end

      DatabaseDumper::V2_RESULTS_SANITIZERS.each do |table_name, table_sanitizer|
        it "defines a sanitizer of table '#{table_name}'" do
          unless table_sanitizer == :skip_all_rows
            where_clause = table_sanitizer[:where_clause]
            expect(where_clause).to be_nil.or(match(/WHERE/)).or(match(/JOIN/))
            where_clause = table_sanitizer[:order_by_clause]
            expect(where_clause).to be_nil.or(match(/ORDER BY/))
            column_sanitizers = table_sanitizer[:column_sanitizers]
            column_names = with_database(:results_dump_v2) { ActiveRecord::Base.connection.columns(table_name).map(&:name) }
            expect(column_sanitizers.keys).to match_array(column_names)
          end
        end
      end
    end
  end
end
