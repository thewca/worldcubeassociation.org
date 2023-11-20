# frozen_string_literal: true

class UserGroup < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
    teams: "teams",
  }

  def self.regions
    UserGroup.where(group_type: "delegate_regions", parent_group_id: nil)
  end
end
