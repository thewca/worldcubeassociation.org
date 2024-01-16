# frozen_string_literal: true

class UserRole < ApplicationRecord
  DELEGATE_ROLE_ID = "dummyRoleId"

  belongs_to :user
  belongs_to :group, class_name: "UserGroup"
  belongs_to :metadata, polymorphic: true, optional: true

  delegate :group_type, to: :group

  def is_active
    self.end_date.nil? || self.end_date > Date.today
  end

  # In future, we will remove the 'self.' and make this a class method.
  def self.is_lead?(role)
    is_actual_role = role.is_a?(UserRole) # Eventually, all roles will be migrated to the new system, till then some roles will actually be hashes.
    group_type = is_actual_role ? role.group_type : role[:group_type]
    status = is_actual_role ? role.metadata[:status] : role[:metadata][:status]
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate"].include?(status)
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      ["leader"].include?(status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      true # All board members & officers are considered as leads.
    else
      false
    end
  end

  # In future, we will remove the 'self.' and make this a class method.
  def self.is_eligible_voter?(role)
    is_actual_role = role.is_a?(UserRole) # Eventually, all roles will be migrated to the new system, till then some roles will actually be hashes.
    group_type = is_actual_role ? role.group_type : role[:group_type]
    status = is_actual_role ? role.metadata[:status] : role[:metadata][:status]
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate", "delegate"].include?(status)
    when UserGroup.group_types[:teams_committees]
      ["leader", "senior_member"].include?(status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      true # All board members & officers are considered as eligible voters.
    else
      false
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[],
    only: %w[id start_date end_date],
    include: %w[group user metadata],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
