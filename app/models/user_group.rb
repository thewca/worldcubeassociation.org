# frozen_string_literal: true

class UserGroup < ApplicationRecord
  # Teams & Committees are recognized by Motion "10.2022.0":
  # https://documents.worldcubeassociation.org/documents/motions/10.2022.0%20-%20Committees%20and%20Teams.pdf
  # Motions starting with "10.YYYY.N" define these teams: https://www.worldcubeassociation.org/documents
  # Councils are recognized by Motions. The corresponding motions related to councils can be found in the following URL:
  # https://www.worldcubeassociation.org/documents
  enum :group_type, {
    delegate_probation: "delegate_probation",
    delegate_regions: "delegate_regions",
    teams_committees: "teams_committees",
    councils: "councils",
    translators: "translators",
    board: "board",
    officers: "officers",
  }

  has_many :direct_child_groups, class_name: "UserGroup", inverse_of: :parent_group, foreign_key: "parent_group_id"
  belongs_to :metadata, polymorphic: true, optional: true
  belongs_to :parent_group, class_name: "UserGroup", optional: true

  has_many :user_roles, foreign_key: "group_id"

  scope :root_groups, -> { where(parent_group: nil) }

  def all_child_groups
    [direct_child_groups, direct_child_groups.map(&:all_child_groups)].flatten
  end

  def roles_migrated?
    user_roles.any?
  end

  # For teams which have groups migrated but not roles, this method will help to get the
  # corresponding team to fetch the team_members.
  def team
    Team.find_by(friendly_id: self.metadata.friendly_id)
  end

  def roles
    role_list = self.user_roles.to_a
    if self.teams_committees? && !self.roles_migrated? && self.team.present?
      TeamMember.where(team_id: self.team.id).each do |team_member|
        role_list << team_member.role
      end
    end
    role_list
  end

  def active_roles
    self.roles.select { |role| UserRole.is_active?(role) }
  end

  def roles_of_direct_child_groups
    self.direct_child_groups.map(&:roles).flatten
  end

  def roles_of_all_child_groups
    self.all_child_groups.map(&:roles).flatten
  end

  def active_roles_of_direct_child_groups
    self.direct_child_groups.map(&:active_roles).flatten
  end

  def active_roles_of_all_child_groups
    self.all_child_groups.map(&:active_roles).flatten
  end

  def users
    self.roles.map { |role| UserRole.user(role) }
  end

  def active_users
    self.active_roles.map { |role| UserRole.user(role) }
  end

  def users_of_direct_child_groups
    self.roles_of_direct_child_groups.map { |role| UserRole.user(role) }
  end

  def users_of_all_child_groups
    self.roles_of_all_child_groups.map { |role| UserRole.user(role) }
  end

  def active_users_of_direct_child_groups
    self.active_roles_of_direct_child_groups.map { |role| UserRole.user(role) }
  end

  def active_users_of_all_child_groups
    self.active_roles_of_all_child_groups.map { |role| UserRole.user(role) }
  end

  def self.group_types_containing_status_metadata
    [
      UserGroup.group_types[:delegate_regions],
      UserGroup.group_types[:teams_committees],
      UserGroup.group_types[:councils],
      UserGroup.group_types[:officers],
    ]
  end

  # Returns human readable name of group type
  def self.group_type_name
    {
      delegate_probation: "Delegate Probation",
      delegate_regions: "Delegate Regions",
      teams_committees: "Teams & Committees",
      councils: "Councils",
      translators: "Translators",
      board: "Board",
      officers: "Officers",
    }
  end

  def self.delegate_region_groups
    UserGroup.where(group_type: UserGroup.group_types[:delegate_regions])
  end

  def self.delegate_region_groups_senior_delegates
    UserGroup.delegate_region_groups.root_groups.map(&:lead_user).compact
  end

  def self.delegate_probation_groups
    UserGroup.where(group_type: UserGroup.group_types[:delegate_probation])
  end

  def self.translator_groups
    UserGroup.where(group_type: UserGroup.group_types[:translators])
  end

  def self.board_group
    UserGroup.board.first
  end

  def self.teams_committees_group_wct
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wct').user_group
  end

  def self.teams_committees_group_wcat
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wcat').user_group
  end

  def self.teams_committees_group_wdc
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wdc').user_group
  end

  def self.teams_committees_group_wdpc
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wdpc').user_group
  end

  def self.teams_committees_group_wec
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wec').user_group
  end

  def self.teams_committees_group_weat
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'weat').user_group
  end

  def self.teams_committees_group_wfc
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wfc').user_group
  end

  def self.teams_committees_group_wmt
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wmt').user_group
  end

  def self.teams_committees_group_wqac
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wqac').user_group
  end

  def self.teams_committees_group_wrc
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wrc').user_group
  end

  def self.teams_committees_group_wrt
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wrt').user_group
  end

  def self.council_group_wac
    GroupsMetadataCouncils.find_by(friendly_id: 'wac').user_group
  end

  def self.teams_committees_group_wst
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wst').user_group
  end

  def self.teams_committees_group_wst_admin
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wst_admin').user_group
  end

  def self.teams_committees_group_wct_china
    GroupsMetadataTeamsCommittees.find_by(friendly_id: 'wct_china').user_group
  end

  def senior_delegate
    if parent_group_id.nil?
      self.lead_user
    else
      parent_group.senior_delegate
    end
  end

  def lead_role
    self.active_roles.find { |role| role.is_a?(UserRole) ? role.is_lead? : role[:is_lead] }
  end

  # TODO: Once the roles migration is done, add a validation to make sure there is only one lead_user per group.
  def lead_user
    UserRole.user(self.lead_role)
  end

  # Unique status means that there can only be one active user with this status in the group.
  def unique_status?(status)
    if self.group_type == UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate"].include?(status)
    elsif [UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]].include?(self.group_type)
      status == "leader"
    else
      false
    end
  end

  def is_root_group?
    parent_group_id.nil?
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
    methods: %w[lead_user],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
