# frozen_string_literal: true

class RenameRolesToUserRoles < ActiveRecord::Migration[7.1]
  def change
    rename_table :roles, :user_roles
  end
end
