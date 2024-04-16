# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  has_one :user_group, as: :metadata
end
