# frozen_string_literal: true

class AddRolesToDeviseUser < ActiveRecord::Migration
  def change
    add_column :devise_users, :admin, :boolean
    add_column :devise_users, :results_team, :boolean
  end
end
