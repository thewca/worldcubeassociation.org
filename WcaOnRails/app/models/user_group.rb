# frozen_string_literal: true

class UserGroup < ApplicationRecord
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
    teams_committees: "teams_committees",
    councils: "councils",
    translators: "translators",
    board: "board",
    officers: "officers",
  }

  def self.group_types_containing_status_metadata
    [
      UserGroup.group_types[:delegate_regions],
      UserGroup.group_types[:teams_committees],
      UserGroup.group_types[:councils],
    ]
  end

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

  def self.delegate_region_groups
    UserGroup.where(group_type: "delegate_regions", parent_group_id: nil)
  end

  def self.delegate_probation_groups
    UserGroup.where(group_type: "delegate_probation", parent_group_id: nil)
  end

  def self.translator_groups
    UserGroup.where(group_type: UserGroup.group_types[:translators], parent_group_id: nil)
  end

  def senior_delegate
    User.find_by(region_id: self.id, delegate_status: "senior_delegate")
  end

  def roles
    role_list = UserRole.where(group_id: self.id).to_a
    if self.group_type == "delegate_regions"
      role_list += User.where(region_id: self.id).where.not(delegate_status: nil).map do |delegate_user|
        delegate_user.delegate_role
      end
    end
    role_list
  end

  def active_roles
    self.roles.select { |role| role.is_a?(UserRole) ? role.is_active? : role[:is_active] }
  end

  def users
    if self.group_type == UserGroup.group_types[:delegate_regions]
      self.roles.map { |role| role[:user] }
    else
      self.roles.map(&:user)
    end
  end

  def active_users
    self.active_roles.map(&:user)
  end

  # TODO: Once the roles migration is done, add a validation to make sure there is only one lead_user per group.
  def lead_user
    if self.group_type == UserGroup.group_types[:delegate_regions]
      if self.parent_group_id.nil?
        self.senior_delegate
      else
        lead_role = self.active_roles.find { |role| role.is_a?(UserRole) ? role.is_lead? : role[:is_lead] }
        lead_role ? lead_role.user : nil
      end
    end
  end

  # Unique status means that there can only be one active user with this status in the group.
  def unique_status?(status)
    if self.group_type == UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate"].include?(status)
    elsif self.group_type == UserGroup.group_types[:teams_committees]
      status == "leader"
    else
      false
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
    methods: %w[lead_user],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
