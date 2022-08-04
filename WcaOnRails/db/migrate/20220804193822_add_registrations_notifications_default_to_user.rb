# frozen_string_literal: true

class AddRegistrationsNotificationsDefaultToUser < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :registrations_notifications, :boolean, default: false
  end
end
