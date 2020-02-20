# frozen_string_literal: true

class CreateSubscriptionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :subscriptions do |t|
      t.integer :user_id, null: false

      t.integer :latitude, null: true
      t.integer :longitude, null: true
      t.integer :distance_km, null: true

      t.string :region_id, null: true

      t.integer :championship, null: true

      t.string :event_id, null: true

      t.date :start_date, default: '1970-01-01'
      t.date :end_date, default: '9999-12-31'

      t.boolean :email_on_creation, default: false
      t.boolean :bookmark_on_creation, default: false

      t.timestamps
    end
    add_index :subscriptions, :user_id 
  end
end
