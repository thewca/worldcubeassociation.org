# frozen_string_literal: true

class GroupsMetadataBoard < ApplicationRecord
  self.table_name = "groups_metadata_board"

  def self.email
    UserGroup.board_group.metadata.email
  end
end
