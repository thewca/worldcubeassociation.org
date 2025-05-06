# frozen_string_literal: true

class RenameCompetitionColumns < ActiveRecord::Migration[7.2]
  def change
    change_table :Competitions, bulk: true do |t|
      t.rename :cityName, :city_name
      t.rename :countryId, :country_id
      t.rename :venueAddress, :venue_address
      t.rename :venueDetails, :venue_details
      t.rename :cellName, :cell_name
      t.rename :showAtAll, :show_at_all
    end

    rename_table :Competitions, :competitions
  end
end
