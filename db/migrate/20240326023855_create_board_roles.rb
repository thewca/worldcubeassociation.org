# frozen_string_literal: true

class CreateBoardRoles < ActiveRecord::Migration[7.1]
  def create_user_role_for_team_member(team_member, group)
    UserRole.create!(
      user_id: team_member.user_id,
      group_id: group.id,
      start_date: team_member.start_date,
      end_date: team_member.end_date,
    )
  end

  def change
    board_group = UserGroup.board_group
    Team.c_find_by_friendly_id!('board').team_members.each do |member|
      create_user_role_for_team_member(member, board_group)
    end
  end
end
