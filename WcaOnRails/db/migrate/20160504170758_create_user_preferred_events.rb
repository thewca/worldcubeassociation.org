class CreateUserPreferredEvents < ActiveRecord::Migration
  def change
    # Remove the column from users.
    remove_column :users, :preferred_event_ids

    # Instead, add a separate table for preferred events.
    create_table :user_preferred_events do |t|
      t.references :user
      t.string :event_id
    end
    add_index :user_preferred_events, [:user_id, :event_id], unique: true
  end
end
