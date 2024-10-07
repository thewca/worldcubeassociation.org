# frozen_string_literal: true

class GroupsMetadataCouncils < ApplicationRecord
  has_one :user_group, as: :metadata
end
