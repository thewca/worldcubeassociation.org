# frozen_string_literal: true

class CreateScheduleActivities < ActiveRecord::Migration[5.1]
  def change
    create_table :schedule_activities do |t|
      t.references :holder, polymorphic: true, index: true
      t.integer :wcif_id
      t.string :name
      t.string :activity_code
      t.datetime :start_time
      t.datetime :end_time
      t.integer :scramble_set_id

      t.timestamps
    end
    add_index :schedule_activities, [:holder_type, :holder_id, :wcif_id], unique: true, name: "index_activities_on_their_id_within_holder"
  end
end
