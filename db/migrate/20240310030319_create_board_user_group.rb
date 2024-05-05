# frozen_string_literal: true

class CreateBoardUserGroup < ActiveRecord::Migration[7.1]
  def change
    board_team = Team.c_find_by_friendly_id!('board')
    metadata = GroupsMetadataBoard.create!(email: board_team.email)
    UserGroup.create!(name: board_team.name, group_type: :board, is_active: true, is_hidden: false, metadata: metadata)
  end
end
