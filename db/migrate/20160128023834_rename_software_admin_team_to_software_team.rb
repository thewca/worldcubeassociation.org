# frozen_string_literal: true

class RenameSoftwareAdminTeamToSoftwareTeam < ActiveRecord::Migration
  def change
    rename_column :users, :software_admin_team, :software_team
    rename_column :users, :software_admin_team_leader, :software_team_leader
  end
end
