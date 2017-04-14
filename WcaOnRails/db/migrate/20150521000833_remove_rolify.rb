# frozen_string_literal: true

class RemoveRolify < ActiveRecord::Migration
  def change
    drop_table :devise_users_roles
    drop_table :roles
  end
end
