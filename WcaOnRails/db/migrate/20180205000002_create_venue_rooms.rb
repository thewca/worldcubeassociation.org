class CreateVenueRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :venue_rooms do |t|
      t.references :schedule_venue, foreign_key: true
      t.string :name

      t.timestamps
    end
  end
end
