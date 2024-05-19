# frozen_string_literal: true

class MigrateBannedCompetitors < ActiveRecord::Migration[7.1]
  def change
    banned_team = Team.banned
    group = UserGroup.create!(
      name: banned_team.name,
      group_type: UserGroup.group_types[:banned_competitors],
      is_active: true,
      is_hidden: true,
    )
    banned_team.team_members.each do |team_member|
      metadata = RolesMetadataBannedCompetitors.create!
      UserRole.create!(
        user_id: team_member.user_id,
        group_id: group.id,
        start_date: team_member.start_date,
        end_date: team_member.end_date,
        metadata: metadata,
      )
    end
  end
end
