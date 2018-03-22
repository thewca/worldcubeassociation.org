# frozen_string_literal: true

class CreateVenueRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :venue_rooms do |t|
      t.references :competition_venue
      t.integer :wcif_id
      t.string :name

      t.timestamps
    end
    add_index :venue_rooms, [:competition_venue_id, :wcif_id], unique: true
  end
end
