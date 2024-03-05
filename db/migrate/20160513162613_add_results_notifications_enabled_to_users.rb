# frozen_string_literal: true

class AddResultsNotificationsEnabledToUsers < ActiveRecord::Migration
  def change
    add_column :users, :results_notifications_enabled, :boolean, default: false
  end
end
