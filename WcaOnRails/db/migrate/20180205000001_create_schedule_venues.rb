class CreateScheduleVenues < ActiveRecord::Migration[5.1]
  def change
    create_table :schedule_venues do |t|
      t.references :competition_schedule
      t.integer :wcif_id
      t.string :name
      t.integer :latitude_microdegrees
      t.integer :longitude_microdegrees
      t.string :timezone_id

      t.timestamps
    end
    add_index :schedule_venues, [:competition_schedule_id, :wcif_id], unique: true
  end
end
