# frozen_string_literal: true

class AddRegistrationNotificationsDefaultToUser < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :registration_notifications_enabled, :boolean, default: false
  end
end
