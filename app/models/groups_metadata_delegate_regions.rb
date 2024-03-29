# frozen_string_literal: true

class GroupsMetadataDelegateRegions < ApplicationRecord
  has_one :user_group, -> { where(metadata_type: 'GroupsMetadataDelegateRegions') }, class_name: 'UserGroup', foreign_key: 'metadata_id'
end
