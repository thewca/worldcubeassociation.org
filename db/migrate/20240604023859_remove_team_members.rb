# frozen_string_literal: true

class RemoveTeamMembers < ActiveRecord::Migration[7.1]
  def change
    drop_table :team_members
  end
end
