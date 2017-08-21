# frozen_string_literal: true

class FixTablesAndDatabaseCollation < ActiveRecord::Migration[5.1]
  def change
    # Change database collation.
    execute "ALTER DATABASE `#{ActiveRecord::Base.connection.current_database}` COLLATE utf8mb4_unicode_ci"
    # Change collation of the existing tables.
    ActiveRecord::Base.connection.tables.each do |table|
      next if /archive_phpbb3\w+|schema_migrations|ar_internal_metadata/.match(table)
      execute "ALTER TABLE `#{table}` COLLATE utf8mb4_unicode_ci"
    end
  end
end
