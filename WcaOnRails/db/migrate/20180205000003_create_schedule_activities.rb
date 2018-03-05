class CreateScheduleActivities < ActiveRecord::Migration[5.1]
  def change
    create_table :schedule_activities do |t|
      t.references :holder, polymorphic: true, index: true
      t.string :name
      t.string :activity_code
      t.datetime :start_time
      t.datetime :end_time
      t.integer :scramble_set_id

      t.timestamps
    end
  end
end
