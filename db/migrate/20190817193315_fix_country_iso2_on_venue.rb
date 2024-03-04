# frozen_string_literal: true

class FixCountryIso2OnVenue < ActiveRecord::Migration[5.2]
  def change
    # This fixes the bad backfill in db/migrate/20190817170648_add_country_iso2_to_venue.rb
    execute "UPDATE competition_venues
JOIN Competitions competition ON competition.id = competition_id
JOIN Countries country ON country.id = competition.countryId
SET competition_venues.country_iso2 = country.iso2;"
  end
end
