# frozen_string_literal: true

# See https://gist.github.com/tjh/1711329#gistcomment-2046518.
class ConvertUtf8ToUtf8mb4 < ActiveRecord::Migration[5.0]
  def db
    ActiveRecord::Base.connection
  end

  def up
    # Foreign keys prevent us from changing the character set of certain columns. You get errors like:
    #  Mysql2::Error: Cannot change column 'id': used in a foreign key constraint 'fk_rails_8d2986d7ea' of table 'wca_development.preferred_formats'
    # Foreign keys have caused us other problems, so I'm taking this as an opportunity to get rid of all of them.
    remove_foreign_key :competition_events, name: :fk_rails_ba6cfdafb1
    remove_foreign_key :poll_options, name: :poll_options_ibfk_1
    remove_foreign_key :preferred_formats, name: :fk_rails_8d2986d7ea
    remove_foreign_key :preferred_formats, name: :fk_rails_c3e0098ed3
    remove_foreign_key :votes, name: :votes_ibfk_1

    execute "ALTER DATABASE `#{db.current_database}` CHARACTER SET utf8mb4;"
    db.tables.each do |table|
      next if %w(ar_internal_metadata schema_migrations).include?(table)
      next if db.views.include?(table) # Skip views. This will not be necessary in Rails 5.1, when `db.tables` will change to only return actual tables.
      execute "ALTER TABLE `#{table}` CHARACTER SET = utf8mb4;"
      db.columns(table).each do |column|
        case column.sql_type
        when /([a-z]*)text/i
          execute "ALTER TABLE `#{table}` CHANGE `#{column.name}` `#{column.name}` #{$1.upcase}TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        when /((?:var)?char)\(([0-9]+)\)/i
          # InnoDB has a maximum index length of 767 bytes, so for utf8 or utf8mb4
          # columns, you can index a maximum of 255 or 191 characters, respectively.
          # If you currently have utf8 columns with indexes longer than 191 characters,
          # you will need to index a smaller number of characters.
          indexed_column = db.indexes(table).any? { |index| index.columns.include?(column.name) }

          sql_type = indexed_column && $2.to_i > 191 ? "#{$1}(191)" : column.sql_type.upcase
          default = column.default.nil? ? '' : "DEFAULT '#{column.default}'"
          null = column.null ? '' : 'NOT NULL'
          execute "ALTER TABLE `#{table}` CHANGE `#{column.name}` `#{column.name}` #{sql_type} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci #{default} #{null};"
        end
      end
    end
  end
end
