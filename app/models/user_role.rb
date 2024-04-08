# frozen_string_literal: true

class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :group, class_name: "UserGroup"
  belongs_to :metadata, polymorphic: true, optional: true

  delegate :group_type, to: :group

  def self.is_visible_to_user?(role, user)
    is_actual_role = role.is_a?(UserRole)
    group = is_actual_role ? role.group : role[:group]
    return true unless group[:is_hidden]
    case group[:group_type]
    when UserGroup.group_types[:delegate_probation]
      user&.can_manage_delegate_probation?
    when UserGroup.group_types[:translators]
      user&.software_team?
    else
      false # Don't allow to view any other hidden groups.
    end
  end

  def self.is_group_type?(role, group_type)
    is_actual_role = role.is_a?(UserRole)
    is_actual_role ? role.group.group_type == group_type : role[:group][:group_type] == group_type
  end

  def self.group(role)
    is_actual_role = role.is_a?(UserRole)
    is_actual_role ? role.group : role[:group]
  end

  def self.user(role)
    return nil if role.nil?
    is_actual_role = role.is_a?(UserRole)
    is_actual_role ? role.user : role[:user]
  end

  def self.is_active?(role)
    is_actual_role = role.is_a?(UserRole)
    is_actual_role ? role.is_active? : role[:is_active]
  end

  def self.status(role)
    is_actual_role = role.is_a?(UserRole)
    return nil if (is_actual_role && role.metadata.nil?) || (!is_actual_role && role[:metadata].nil?)
    is_actual_role ? role.metadata[:status] : role[:metadata][:status]
  end

  STATUS_SORTING_ORDER = {
    UserGroup.group_types[:delegate_regions].to_sym => ["senior_delegate", "regional_delegate", "delegate", "candidate_delegate", "trainee_delegate"],
    UserGroup.group_types[:teams_committees].to_sym => ["leader", "senior_member", "member"],
    UserGroup.group_types[:councils].to_sym => ["leader", "senior_member", "member"],
    UserGroup.group_types[:board].to_sym => ["member"],
    UserGroup.group_types[:officers].to_sym => ["chair", "executive_director", "secretary", "vice_chair", "treasurer"],
  }.freeze

  def self.status_sort_rank(role)
    group_type = UserRole.group_type(role)
    status = UserRole.status(role) || ''
    STATUS_SORTING_ORDER[group_type.to_sym]&.find_index(status) || STATUS_SORTING_ORDER[group_type.to_sym]&.length || 1
  end

  def is_active?
    self.end_date.nil? || self.end_date > Date.today
  end

  # In future, we will remove the 'self.' and make this a class method.
  def self.is_lead?(role)
    is_actual_role = role.is_a?(UserRole) # Eventually, all roles will be migrated to the new system, till then some roles will actually be hashes.
    group_type = is_actual_role ? role.group.group_type : role[:group][:group_type]
    status = UserRole.status(role)
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

  def is_lead?
    status = metadata ? metadata[:status] : nil
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

  def self.is_staff?(role)
    group_type = UserRole.group_type(role)
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate", "delegate", "junior_delegate"].include?(UserRole.status(role))
    when UserGroup.group_types[:board], UserGroup.group_types[:officers], UserGroup.group_types[:teams_committees]
      true
    else
      false
    end
  end

  # In future, we will remove the 'self.' and make this a class method.
  def self.group_type(role)
    is_actual_role = role.is_a?(UserRole) # Eventually, all roles will be migrated to the new system, till then some roles will actually be hashes.
    is_actual_role ? role.group[:group_type] : role[:group][:group_type]
  end

  # In future, we will remove the 'self.' and make this a class method.
  def self.is_eligible_voter?(role)
    group_type = UserRole.group_type(role)
    status = UserRole.status(role)
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

  def self.discourse_user_group(role)
    group_type = UserRole.group_type(role)
    group = UserRole.group(role)
    case group_type
    when UserGroup.group_types[:delegate_regions]
      UserRole.status(role)
    when UserGroup.group_types[:councils]
      group.metadata.friendly_id
    else
      nil
    end
  end

  def self.deprecated_team_role(role)
    group = UserRole.group(role)
    group_type = UserRole.group_type(role)
    user = UserRole.user(role)
    if group_type == UserGroup.group_types[:board]
      friendly_id = UserGroup.group_types[:board]
    else
      is_actual_group = group.is_a?(UserGroup)
      friendly_id = is_actual_group ? group.metadata.friendly_id : group[:metadata][:friendly_id]
    end
    {
      id: role[:id],
      friendly_id: friendly_id,
      leader: UserRole.status(role) == "leader",
      senior_member: UserRole.status(role) == "senior_member",
      name: user.name,
      wca_id: user.wca_id,
      avatar: user.avatar,
    }
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[],
    only: %w[id start_date end_date],
    include: %w[group user metadata],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
