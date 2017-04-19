# frozen_string_literal: true

class RolifyCreateRoles < ActiveRecord::Migration
  def change
    create_table(:roles) do |t|
      t.string :name
      t.references :resource, polymorphic: true

      t.timestamps
    end

    create_table(:devise_users_roles, id: false) do |t|
      t.references :devise_user
      t.references :role
    end

    add_index(:roles, :name)
    add_index(:roles, [:name, :resource_type, :resource_id])
    add_index(:devise_users_roles, [:devise_user_id, :role_id])
  end
end
