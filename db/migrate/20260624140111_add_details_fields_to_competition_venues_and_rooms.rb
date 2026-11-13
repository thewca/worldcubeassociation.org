# frozen_string_literal: true

class AddDetailsFieldsToCompetitionVenuesAndRooms < ActiveRecord::Migration[8.1]
  # add the size limits to existing columns
  def up
    change_table :competition_venues, bulk: true do |t|
      # This "restriction" is actually making the varchar column bigger (240) than the MySQL default (191).
      #   It mirrors the legacy `venue_name` column in the `competition` table, which is 240 chars long, so that we can backfill data.
      t.change :name, :string, limit: 240, null: false, after: :wcif_id
      # This restriction is just to match the semantics of ISO country codes
      t.change :country_iso2, :string, null: false, limit: 2, after: :longitude_microdegrees
    end
  end

  def down
    # The `change` statements without any specific `limit` are reinstating the implicit
    #   MySQL default limits, which were in use before this migration.
    change_table :competition_venues, bulk: true do |t|
      t.change :name, :string, null: false, after: :wcif_id
      t.change :country_iso2, :string, null: false, after: :longitude_microdegrees
    end
  end
end
