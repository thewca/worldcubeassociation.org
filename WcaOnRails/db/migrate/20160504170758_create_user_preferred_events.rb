# frozen_string_literal: true

class CreateUserPreferredEvents < ActiveRecord::Migration
  def change
    create_table :user_preferred_events do |t|
      t.references :user
      t.string :event_id
    end
    add_index :user_preferred_events, [:user_id, :event_id], unique: true
  end
end
