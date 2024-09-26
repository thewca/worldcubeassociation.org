# frozen_string_literal: true

class CreateLane < ActiveRecord::Migration[7.2]
  def change
    create_table :registration_lanes do |t|
      t.references :v2_registrations, null: false, index: true, foreign_key: true
      t.string :lane_name
      t.string :lane_state
      t.json :completed_steps
      t.json :lane_details

      t.timestamps
    end
    add_index :registration_lanes, [:v2_registration_id, :lane_name], unique: true
  end
end
