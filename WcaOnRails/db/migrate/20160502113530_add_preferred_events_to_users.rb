class AddPreferredEventsToUsers < ActiveRecord::Migration
  def change
    add_column :users, :preferred_event_ids, :text
  end
end
