# frozen_string_literal: true

class GroupsMetadataBoard < ApplicationRecord
  def self.email
    UserGroup.board.first.metadata.email
  end
end
