# frozen_string_literal: true

class AddDetailsFieldsToCompetitionVenuesAndRooms < ActiveRecord::Migration[8.1]
  # add the size limits to existing columns
  def up
    # This "restriction" is actually making the varchar column bigger (240) than the MySQL default (191)
    change_column :competition_venues, :name, :string, limit: 240, null: false, after: :wcif_id
    # This restriction is just to match the semantics of ISO country codes
    change_column :competition_venues, :country_iso2, :string, null: false, limit: 2, after: :longitude_microdegrees
  end

  # revert back to using MySQL default limits
  def down
    change_column :competition_venues, :name, :string, null: false, after: :wcif_id
    change_column :competition_venues, :country_iso2, :string, null: false, after: :longitude_microdegrees
  end
end
