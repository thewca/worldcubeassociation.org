# frozen_string_literal: true

class AddTeamsToUsers < ActiveRecord::Migration
  def change
    add_column :users, :wdc_team, :boolean
    add_column :users, :wdc_team_leader, :boolean
    add_column :users, :wrc_team, :boolean
    add_column :users, :wrc_team_leader, :boolean
    add_column :users, :results_team_leader, :boolean

    rename_column :users, :admin, :wca_website_team
    add_column :users, :wca_website_team_leader, :boolean

    add_column :users, :software_admin_team, :boolean
    add_column :users, :software_admin_team_leader, :boolean
  end
end
