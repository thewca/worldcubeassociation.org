# frozen_string_literal: true

class MigrateWstToRoles < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    migrate_team_members_to_group(Team.c_find_by_friendly_id!('wst'), UserGroup.teams_committees_group_wst)
  end
end
