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
