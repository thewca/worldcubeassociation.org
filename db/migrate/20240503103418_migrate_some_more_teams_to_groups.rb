# frozen_string_literal: true

class MigrateSomeMoreTeamsToGroups < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wdc'), UserGroup.teams_committees_group_wdc)
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wec'), UserGroup.teams_committees_group_wec)
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wfc'), UserGroup.teams_committees_group_wfc)
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wmt'), UserGroup.teams_committees_group_wmt)
  end
end
