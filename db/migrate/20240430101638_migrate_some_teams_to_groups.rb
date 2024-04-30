# frozen_string_literal: true

class MigrateSomeTeamsToGroups < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wqac'), UserGroup.teams_committees_group_wqac)
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wct'), UserGroup.teams_committees_group_wct)
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wat'), UserGroup.teams_committees_group_wat)
  end
end
