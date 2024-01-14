# frozen_string_literal: true

class UserGroup < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
    teams_committees: "teams_committees",
    councils: "councils",
    translators: "translators",
  }

  belongs_to :metadata, polymorphic: true, optional: true

  # Returns human readable name of group type
  def self.group_type_name
    {
      delegate_probation: "Delegate Probation",
      delegate_regions: "Delegate Regions",
      teams_committees: "Teams & Committees",
      councils: "Councils",
      translators: "Translators",
    }
  end

  def self.delegate_regions
    UserGroup.where(group_type: "delegate_regions", parent_group_id: nil)
  end

  def senior_delegate
    User.find_by(region_id: self.id, delegate_status: "senior_delegate")
  end

  def roles
    if self.group_type == "delegate_regions"
      User.where(region_id: self.id).where.not(delegate_status: nil).map do |delegate_user|
        delegate_user.delegate_role
      end
    else
      UserRole.where(group_id: self.id)
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
