# frozen_string_literal: true

class MigrateOfficersToRoles < ActiveRecord::Migration[7.1]
  def create_user_role_for_team_member(team_member, status, group)
    metadata = RolesMetadataOfficers.create!(status: status)
    UserRole.create!(
      user_id: team_member.user_id,
      group_id: group.id,
      start_date: team_member.start_date,
      end_date: team_member.end_date,
      metadata: metadata,
    )
  end

  def change
    officer_group = UserGroup.create!(name: 'WCA Officers', group_type: :officers, is_active: true, is_hidden: false)
    Team.c_find_by_friendly_id!('executive_director').team_members.each do |member|
      create_user_role_for_team_member(member, RolesMetadataOfficers.statuses[:executive_director], officer_group)
    end
    Team.c_find_by_friendly_id!('chair').team_members.each do |member|
      create_user_role_for_team_member(member, RolesMetadataOfficers.statuses[:chair], officer_group)
    end
    Team.c_find_by_friendly_id!('vice_chair').team_members.each do |member|
      create_user_role_for_team_member(member, RolesMetadataOfficers.statuses[:vice_chair], officer_group)
    end
    Team.c_find_by_friendly_id!('secretary').team_members.each do |member|
      create_user_role_for_team_member(member, RolesMetadataOfficers.statuses[:secretary], officer_group)
    end
  end
end
