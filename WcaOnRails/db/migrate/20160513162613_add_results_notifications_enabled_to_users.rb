class AddResultsNotificationsEnabledToUsers < ActiveRecord::Migration
  def change
    add_column :users, :results_notifications_enabled, :boolean, default: true
  end
end
