# frozen_string_literal: true
class RemoveTeamLeaderFromTeamMembers < ActiveRecord::Migration
  def change
    remove_column :team_members, :team_leader, :boolean
  end
end
