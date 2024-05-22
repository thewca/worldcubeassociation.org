# frozen_string_literal: true

class GroupsMetadataTranslators < ApplicationRecord
  has_one :user_group, as: :metadata
end
