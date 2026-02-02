# frozen_string_literal: true

require 'rails_helper'

def db
  ActiveRecord::Base.connection
end

RSpec.describe "database" do
  database_info = db.select_one <<~SQL.squish
    SELECT *
    FROM information_schema.schemata
    WHERE schema_name = '#{db.current_database}'
  SQL

  describe "connection" do
    it "charset is set to utf8mb4" do
      expect(ActiveRecord::Base.connection.charset).to eq "utf8mb4"
    end

    it "collation is set to utf8mb4_unicode_ci" do
      expect(ActiveRecord::Base.connection.collation).to eq "utf8mb4_unicode_ci"
    end
  end

  describe "database" do
    it "charset is set to utf8mb4" do
      expect(database_info["DEFAULT_CHARACTER_SET_NAME"]).to eq "utf8mb4"
    end

    it "collation is set to utf8mb4_unicode_ci" do
      expect(database_info["DEFAULT_COLLATION_NAME"]).to eq "utf8mb4_unicode_ci"
    end
  end

  db.tables.each do |table|
    next if /archive_phpbb3\w+|schema_migrations|ar_internal_metadata/.match?(table)

    describe(table) do
      table_info = db.select_one <<~SQL.squish
        SELECT *
        FROM information_schema.tables T
        JOIN information_schema.COLLATION_CHARACTER_SET_APPLICABILITY CCSA
          ON CCSA.collation_name = T.table_collation
        WHERE T.table_schema = '#{db.current_database}'
          AND T.table_name = '#{table}'
      SQL

      it "charset is set to utf8mb4" do
        expect(table_info["CHARACTER_SET_NAME"]).to eq "utf8mb4"
      end

      it "collation is set to utf8mb4_unicode_ci" do
        expect(table_info["COLLATION_NAME"]).to eq "utf8mb4_unicode_ci"
      end

      db.columns(table).each do |column|
        describe(column.name) do
          column_info = db.select_one <<~SQL.squish
            SELECT *
            FROM information_schema.columns
            WHERE table_schema = '#{db.current_database}'
              AND table_name = '#{table}'
              AND column_name='#{column.name}'
          SQL

          if %i[text string].include?(column.type)
            it "charset is set to utf8mb4" do
              expect(column_info["CHARACTER_SET_NAME"]).to eq "utf8mb4"
            end

            it "collation is set to utf8mb4_unicode_ci" do
              expect(column_info["COLLATION_NAME"]).to eq "utf8mb4_unicode_ci"
            end
          end
        end
      end
    end
  end
end
