class CreateScheduleVenues < ActiveRecord::Migration[5.1]
  def change
    create_table :schedule_venues do |t|
      t.references :competition_schedule
      t.string :name
      t.integer :latitude_microdegrees
      t.integer :longitude_microdegrees
      t.string :timezone_id

      t.timestamps
    end
  end
end
