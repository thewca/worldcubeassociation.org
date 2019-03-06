# frozen_string_literal: true

class CreateAssignments < ActiveRecord::Migration[5.2]
  def change
    create_table :assignments do |t|
      t.references :registration, index: true
      t.references :schedule_activity, index: true
      t.integer :station_number
      t.string :assignment_code, null: false
    end
  end
end
