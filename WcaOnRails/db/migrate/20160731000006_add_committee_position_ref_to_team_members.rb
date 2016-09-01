# frozen_string_literal: true
class AddCommitteePositionRefToTeamMembers < ActiveRecord::Migration
  def change
    add_reference :team_members, :committee_position, index: true, foreign_key: true
    add_foreign_key :team_members, :teams
    add_foreign_key :team_members, :users
  end
end
