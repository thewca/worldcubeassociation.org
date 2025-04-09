# frozen_string_literal: true

module RoleMigrationHelper
  def create_user_role_for_team_member(team_member, group)
    status = if team_member.leader?
               RolesMetadataTeamsCommittees.statuses[:leader]
             elsif team_member.senior_member?
               RolesMetadataTeamsCommittees.statuses[:senior_member]
             else
               RolesMetadataTeamsCommittees.statuses[:member]
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

  def migrate_team_members_to_group(team, group)
    team.team_members.each do |team_member|
      create_user_role_for_team_member(team_member, group)
    end
  end
end
