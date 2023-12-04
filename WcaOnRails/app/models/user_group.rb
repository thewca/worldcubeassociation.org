# frozen_string_literal: true

class UserGroup < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
    teams: "teams",
  }

  belongs_to :metadata, polymorphic: true, optional: true

  def self.delegate_regions
    UserGroup.where(group_type: "delegate_regions", parent_group_id: nil)
  end

  def roles
    if self.group_type == "delegate_regions"
      User.where(region_id: self.id).where.not(delegate_status: nil).map do |delegate_user|
        delegate_user.delegate_role
      end
    else
      Role.where(group_id: self.id)
    end
  end
end
