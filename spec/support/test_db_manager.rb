# frozen_string_literal: true

class TestDbManager
  CONSTANT_TABLES = %w[
    continents
    countries
    eligible_country_iso2s_for_championship
    events
    formats
    cronjob_statistics
    preferred_formats
    round_types
    user_groups
    groups_metadata_delegate_regions
    groups_metadata_board
    groups_metadata_councils
    groups_metadata_teams_committees
    groups_metadata_translators
    country_band_details
    sanity_checks
    sanity_check_categories
  ].freeze

  def self.fill_tables
    Rails.application.load_tasks
    Rake::Task["db:seed:common"].invoke
  end
end
