# frozen_string_literal: true

class TestDbManager
  CONSTANT_TABLES = %w(
    continents
    countries
    eligible_country_iso2s_for_championship
    events
    formats
    preferred_formats
    RoundTypes
    teams
    timestamps
  ).freeze

  def self.fill_tables
    Rails.application.load_tasks
    Rake::Task["db:seed:common"].invoke
  end
end
