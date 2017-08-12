# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "structure.sql" do
  let!(:structure_sql) do
    # Load structure.sql excluding the archived phpbb3 tables as well as the Rails internal ones.
    File.read("#{Rails.root}/db/structure.sql")
        .gsub!(/-- Table structure for table .(archive_phpbb3\w+|schema_migrations|ar_internal_metadata)..*?(?=-- Table structure for table)/m, "")
  end

  describe "charset" do
    it "is set to utf8mb4" do
      table_charsets = structure_sql.scan(/DEFAULT CHARSET=(\w+)/).flatten!
      column_charsets = structure_sql.scan(/CHARACTER SET (\w+)/).flatten!
      expect(table_charsets.uniq).to eq %w(utf8mb4)
      expect(column_charsets.uniq).to eq %w(utf8mb4)
    end
  end

  describe "collation" do
    it "is set to utf8mb4_unicode_ci" do
      table_collations = structure_sql.scan(/COLLATE=(\w+)/).flatten!
      column_collations = structure_sql.scan(/COLLATE (\w+)/).flatten!
      expect(table_collations.uniq).to eq %w(utf8mb4_unicode_ci)
      expect(column_collations.uniq).to eq %w(utf8mb4_unicode_ci)
    end
  end
end
