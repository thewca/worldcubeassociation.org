# frozen_string_literal: true

# Disabling Style/MixinUsage because SortHelper cannot be included inside class as static methods need to access it.
include SortHelper # rubocop:disable Style/MixinUsage

class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :group, class_name: "UserGroup"
  belongs_to :metadata, polymorphic: true, optional: true

  delegate :group_type, to: :group

  scope :active, -> { where(end_date: nil).or(inactive.invert_where) }
  scope :inactive, -> { where(end_date: ..Date.today) }

  UserRoleChange = Struct.new(
    :changed_parameter,
    :previous_value,
    :new_value,
    keyword_init: true,
  )

  STATUS_RANK = {
    UserGroup.group_types[:delegate_regions].to_sym => [
      RolesMetadataDelegateRegions.statuses[:trainee_delegate],
      RolesMetadataDelegateRegions.statuses[:junior_delegate],
      RolesMetadataDelegateRegions.statuses[:delegate],
      RolesMetadataDelegateRegions.statuses[:regional_delegate],
      RolesMetadataDelegateRegions.statuses[:senior_delegate],
    ],
    UserGroup.group_types[:teams_committees].to_sym => [
      RolesMetadataTeamsCommittees.statuses[:member],
      RolesMetadataTeamsCommittees.statuses[:senior_member],
      RolesMetadataTeamsCommittees.statuses[:leader],
    ],
    UserGroup.group_types[:councils].to_sym => [
      RolesMetadataCouncils.statuses[:member],
      RolesMetadataCouncils.statuses[:senior_member],
      RolesMetadataCouncils.statuses[:leader],
    ],
    UserGroup.group_types[:officers].to_sym => [
      RolesMetadataOfficers.statuses[:treasurer],
      RolesMetadataOfficers.statuses[:vice_chair],
      RolesMetadataOfficers.statuses[:secretary],
      RolesMetadataOfficers.statuses[:executive_director],
      RolesMetadataOfficers.statuses[:chair],
    ],
  }.freeze

  GROUP_TYPE_RANK_ORDER = [
    UserGroup.group_types[:board],
    UserGroup.group_types[:officers],
    UserGroup.group_types[:teams_committees],
    UserGroup.group_types[:delegate_regions],
    UserGroup.group_types[:councils],
  ].freeze

  SORT_WEIGHT_LAMBDAS = {
    startDate:
      lambda { |role| role.start_date.to_time.to_i },
    lead:
      lambda { |role| role.is_lead? ? 0 : 1 },
    eligibleVoter:
      lambda { |role| role.is_eligible_voter? ? 0 : 1 },
    groupTypeRank:
      lambda { |role| GROUP_TYPE_RANK_ORDER.find_index(role.group_type) || GROUP_TYPE_RANK_ORDER.length },
    status:
      lambda { |role| role.status_rank },
    name:
      lambda { |role| role.user.name },
    groupName:
      lambda { |role| role.group.name },
    location:
      lambda { |role| role.metadata.location || '' },
  }.freeze

  def self.status_rank(group_type, status)
    STATUS_RANK[group_type.to_sym]&.find_index(status) || STATUS_RANK[group_type.to_sym]&.length || 1
  end

  def status_rank
    status = metadata&.status || ''
    UserRole.status_rank(group_type, status)
  end

  def is_active?
    self.end_date.nil? || self.end_date > Date.today
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

  def is_staff?
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate", "delegate", "junior_delegate"].include?(metadata.status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers], UserGroup.group_types[:teams_committees]
      true
    else
      false
    end
  end

  def is_eligible_voter?
    status = metadata&.status
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

  def discourse_user_group
    case group_type
    when UserGroup.group_types[:delegate_regions]
      metadata.status
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      group.metadata.friendly_id
    when UserGroup.group_types[:board]
      UserGroup.group_types[:board]
    else
      nil
    end
  end

  def can_user_read?(user)
    # A user can view a role if:
    # 1. the role belongs to a non-hidden group, or
    # 2. the user has read-access to that group.
    !group.is_hidden || user&.has_permission?(:can_read_groups, group.id)
  end

  def self.filter_roles_for_logged_in_user(roles, current_user)
    roles.select { |role| role.can_user_read?(current_user) }
  end

  def self.filter_roles_for_parameters(roles, params)
    status = params[:status]
    is_active = params.key?(:isActive) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isActive)) : nil
    is_group_hidden = params.key?(:isGroupHidden) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isGroupHidden)) : nil
    group_type = params[:groupType]
    is_lead = params.key?(:isLead) ? ActiveRecord::Type::Boolean.new.cast(params.require(:isLead)) : nil

    roles.reject do |role|
      # Here, instead of foo.present? we are using !foo.nil? because foo.present? returns false if
      # foo is a boolean false but we need to actually check if the boolean is present or not.
      (
        (!status.nil? && status != role.metadata&.status) ||
        (!is_active.nil? && is_active != role.is_active?) ||
        (!is_group_hidden.nil? && is_group_hidden != role.group.is_hidden) ||
        (!group_type.nil? && group_type != role.group_type) ||
        (!is_lead.nil? && is_lead != role.is_lead?)
      )
    end
  end

  def self.filter_roles(roles, current_user, params)
    roles = UserRole.filter_roles_for_logged_in_user(roles, current_user)
    UserRole.filter_roles_for_parameters(roles, params)
  end

  # Sorts the list of roles based on the given list of sort keys and directions.
  def self.sort_roles(roles, sort_param)
    sort_param ||= ''
    sort(roles, sort_param, SORT_WEIGHT_LAMBDAS)
  end

  def deprecated_team_role
    if group_type == UserGroup.group_types[:board]
      friendly_id = UserGroup.group_types[:board]
    else
      friendly_id = group.metadata.friendly_id
    end
    {
      id: self.id,
      friendly_id: friendly_id,
      leader: metadata&.status == "leader",
      senior_member: metadata&.status == "senior_member",
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
