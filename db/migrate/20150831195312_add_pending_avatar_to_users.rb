# frozen_string_literal: true

class AddPendingAvatarToUsers < ActiveRecord::Migration
  def change
    add_column :users, :pending_avatar, :string
  end
end
