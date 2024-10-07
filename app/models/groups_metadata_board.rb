# frozen_string_literal: true

class GroupsMetadataBoard < ApplicationRecord
  include Cachable

  self.table_name = "groups_metadata_board"

  has_one :user_group, as: :metadata

  def self.singleton_metadata
    self.c_values.first
  end

  def self.email
    self.singleton_metadata.email
  end
end
