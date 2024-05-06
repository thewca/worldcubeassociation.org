# frozen_string_literal: true

class MigrateWrtToRoles < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wrt'), UserGroup.teams_committees_group_wrt)
  end
end
