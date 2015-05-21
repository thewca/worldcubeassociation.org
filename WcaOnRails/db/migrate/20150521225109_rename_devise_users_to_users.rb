class RenameDeviseUsersToUsers < ActiveRecord::Migration
  def change
    rename_table :devise_users, :users
  end
end
