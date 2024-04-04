# frozen_string_literal: true

class MigrateWacRoles < ActiveRecord::Migration[7.1]
  def create_user_role_for_team_member(team_member, group)
    if team_member.leader?
      status = RolesMetadataCouncils.statuses[:leader]
    elsif team_member.senior_member?
      status = RolesMetadataCouncils.statuses[:senior_member]
    else
      status = RolesMetadataCouncils.statuses[:member]
    end
    metadata = RolesMetadataCouncils.create!(status: status)
    UserRole.create!(
      user_id: team_member.user_id,
      group_id: group.id,
      start_date: team_member.start_date,
      end_date: team_member.end_date,
      metadata: metadata,
    )
  end

  def change
    UserGroup.councils.each do |council|
      Team.find_by(friendly_id: council.metadata.friendly_id).team_members.each do |member|
        create_user_role_for_team_member(member, council)
      end
    end
  end
end
