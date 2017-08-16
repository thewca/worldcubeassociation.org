# frozen_string_literal: true

class TestDbManager
  CONSTANT_TABLES = %w(
    Countries
    Continents
    Events
    RoundTypes
    Formats
    preferred_formats
    teams
    eligible_country_iso2s_for_championship
  ).freeze

  def self.fill_tables
    Seedbank.load_tasks
    Rake::Task["db:seed:common"].invoke
  end
end

RSpec.describe TestDbManager do
  it "CONSTANT_TABLES includes all tables filled in the files inside /db/seeds/ directory" do
    expected_files = TestDbManager::CONSTANT_TABLES.map do |table_name|
      "db/seeds/#{table_name.underscore}.seeds.rb"
    end
    expect(Dir["db/seeds/*.seeds.rb"]).to match_array expected_files
  end
end
