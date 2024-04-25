# frozen_string_literal: true

class GroupsMetadataDelegateRegions < ApplicationRecord
  has_one :user_group, as: :metadata

  def email
    super || "delegates.#{friendly_id}@worldcubeassociation.org"
  end
end
