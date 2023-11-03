# frozen_string_literal: true

class UserGroup < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
  }

  def self.regions
    delegate_regions_base = UserGroup.find_by!(parent_group_id: nil, group_type: "delegate_regions")
    UserGroup.where(group_type: "delegate_regions", parent_group_id: delegate_regions_base.id)
  end
end
