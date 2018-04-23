# frozen_string_literal: true

class CreateCompetitionVenues < ActiveRecord::Migration[5.1]
  def change
    create_table :competition_venues do |t|
      t.string :competition_id, null: false
      t.integer :wcif_id, null: false
      t.string :name, null: false
      t.integer :latitude_microdegrees, null: false
      t.integer :longitude_microdegrees, null: false
      t.string :timezone_id, null: false

      t.timestamps
    end
    add_index :competition_venues, :competition_id
    add_index :competition_venues, [:competition_id, :wcif_id], unique: true
  end
end
