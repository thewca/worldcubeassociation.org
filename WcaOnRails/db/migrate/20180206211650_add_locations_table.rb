# frozen_string_literal: true

class AddLocationsTable < ActiveRecord::Migration[5.1]
  def change
    create_table :locations do |t|
      t.integer :user_id, null: false
      t.integer :latitude_microdegrees
      t.integer :longitude_microdegrees
      t.integer :notification_radius_km
      t.timestamps
    end

    add_column :users, :competition_notifications_enabled, :boolean
  end
end
