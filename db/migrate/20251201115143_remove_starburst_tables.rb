# frozen_string_literal: true

class RemoveStarburstTables < ActiveRecord::Migration[8.1]
  def change
    drop_table :starburst_announcement_views do |t|
      t.integer :user_id
      t.integer :announcement_id
      t.timestamps
    end
    drop_table :starburst_announcements do |t|
      t.text :title
      t.text :body
      t.datetime :start_delivering_at
      t.datetime :stop_delivering_at
      t.text :limit_to_users
      t.timestamps
    end
  end
end
