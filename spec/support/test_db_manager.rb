# frozen_string_literal: true

class TestDbManager
  CONSTANT_TABLES = %w(
    Continents
    Countries
    eligible_country_iso2s_for_championship
    Events
    Formats
    cronjob_statistics
    preferred_formats
    RoundTypes
    teams
    user_groups
    user_roles
    groups_metadata_delegate_regions
    groups_metadata_board
    groups_metadata_councils
    groups_metadata_teams_committees
    groups_metadata_translators
  ).freeze

  def self.fill_tables
    Rails.application.load_tasks
    Rake::Task["db:seed:common"].invoke
  end
end
