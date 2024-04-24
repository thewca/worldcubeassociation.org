# frozen_string_literal: true

class MigrateWctChinaToRoles < ActiveRecord::Migration[7.1]
  include RoleMigrationHelper

  def change
    team = Team.c_find_by_friendly_id!('wct_china')
    metadata = GroupsMetadataTeamsCommittees.create!(email: team.email, friendly_id: team.friendly_id)
    group = UserGroup.create!(name: team.name, group_type: UserGroup.group_types[:teams_committees], is_active: true, is_hidden: true, metadata: metadata)
    team.team_members.each do |team_member|
      create_user_role_for_team_member(team_member, group)
    end
  end
end
