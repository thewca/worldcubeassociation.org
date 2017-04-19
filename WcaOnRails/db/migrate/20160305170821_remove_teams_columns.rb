# frozen_string_literal: true

class RemoveTeamsColumns < ActiveRecord::Migration
  def change
    remove_column :users, :wrc_team
    remove_column :users, :wrc_team_leader
    remove_column :users, :wdc_team
    remove_column :users, :wdc_team_leader
    remove_column :users, :results_team
    remove_column :users, :results_team_leader
    remove_column :users, :software_team
    remove_column :users, :software_team_leader
  end
end
