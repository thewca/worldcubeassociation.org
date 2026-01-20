# frozen_string_literal: true

class AddReceiveDeveloperUpdatesToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :receive_developer_mails, :boolean, default: false, null: false, after: :competition_notifications_enabled
  end
end
