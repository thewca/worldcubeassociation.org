# frozen_string_literal: true

class RenameDeviseUsersToUsers < ActiveRecord::Migration
  def change
    rename_table :devise_users, :users
  end
end
