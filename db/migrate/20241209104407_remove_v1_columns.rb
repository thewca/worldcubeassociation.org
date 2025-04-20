# frozen_string_literal: true

class RemoveV1Columns < ActiveRecord::Migration[7.2]
  def change
    remove_column :Competitions, :registration_version, :integer, default: 0, null: false
    drop_table :microservice_registrations do |t|
      t.string :competition_id
      t.integer :user_id

      t.timestamps

      t.index [:competition_id, :user_id], unique: true
    end
  end
end
