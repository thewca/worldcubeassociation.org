class CreateVenueRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :venue_rooms do |t|
      t.references :schedule_venue, foreign_key: true
      t.integer :wcif_id
      t.string :name

      t.timestamps
    end
  end
end
