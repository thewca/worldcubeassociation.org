# frozen_string_literal: true

class AddCountryIso2ToVenue < ActiveRecord::Migration[5.2]
  def change
    add_column :competition_venues, :country_iso2, :string, null: false, default: nil

    reversible do |dir|
      dir.up do
        # Backfill the country for all venues. Jeremy manually checked all
        # competitions with multiple venues (there aren't that many), and
        # confirmed that they all happened in a single country:
        #  SELECT c.id FROM Competitions c JOIN competition_venues cv ON cv.competition_id = c.id GROUP BY c.id HAVING COUNT(*) > 1
        execute "UPDATE competition_venues JOIN Competitions JOIN Countries ON Countries.id=Competitions.countryId SET competition_venues.country_iso2 = Countries.iso2;"
      end
      dir.down do
      end
    end
  end
end
