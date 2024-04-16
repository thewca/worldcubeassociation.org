# frozen_string_literal: true

class MigrateWstAdminToRoles < ActiveRecord::Migration[7.1]
  def create_user_role_for_team_member(team_member, group)
    if team_member.leader?
      status = RolesMetadataTeamsCommittees.statuses[:leader]
    elsif team_member.senior_member?
      status = RolesMetadataTeamsCommittees.statuses[:senior_member]
    else
      status = RolesMetadataTeamsCommittees.statuses[:member]
    end
    metadata = RolesMetadataTeamsCommittees.create!(status: status)
    UserRole.create!(
      user_id: team_member.user_id,
      group_id: group.id,
      start_date: team_member.start_date,
      end_date: team_member.end_date,
      metadata: metadata,
    )
  end

  def change
    team = Team.c_find_by_friendly_id!('wst_admin')
    metadata = GroupsMetadataTeamsCommittees.create!(email: team.email, friendly_id: team.friendly_id)
    group = UserGroup.create!(name: team.name, group_type: UserGroup.group_types[:teams_committees], is_active: true, is_hidden: true, metadata: metadata)
    team.team_members.each do |team_member|
      create_user_role_for_team_member(team_member, group)
    end
  end
end
