# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  has_one :user_group, -> { where(metadata_type: 'GroupsMetadataTeamsCommittees') }, class_name: 'UserGroup', foreign_key: 'metadata_id'
end
