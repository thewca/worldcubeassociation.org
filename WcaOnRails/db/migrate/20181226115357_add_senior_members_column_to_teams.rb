# frozen_string_literal: true

class AddSeniorMembersColumnToTeams < ActiveRecord::Migration[5.2]
  def change
    add_column :team_members, :team_senior_member, :boolean, default: false, null: false
  end
end
