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
    banned_competitors: "banned_competitors",
  }

  # There are few associations/methods here that are used only for testing. They are to make sure
  # the connections between group and roles are as expected. It's recommended not to remove them.
  has_many :direct_child_groups, class_name: "UserGroup", inverse_of: :parent_group, foreign_key: "parent_group_id"
  has_many :roles, foreign_key: "group_id", class_name: "UserRole", inverse_of: :group
  has_many :active_roles, -> { active }, foreign_key: "group_id", class_name: "UserRole", inverse_of: :group
  has_many :direct_child_roles, through: :direct_child_groups, source: :roles
  has_many :active_direct_child_roles, -> { active }, through: :direct_child_groups, source: :roles
  has_many :users, through: :roles
  has_many :active_users, through: :active_roles, source: :user
  has_many :direct_child_users, through: :direct_child_roles, source: :user
  has_many :active_direct_child_users, through: :active_direct_child_roles, source: :user

  before_validation :end_active_lead_roles, if: -> { is_active_changed? && !is_active }

  # The `touch` is important because we generally access "semantic" UserGroups
  #   (ie T/Cs, DelegateRegions, Translators, etc.) through their metadata.
  #   This metadata however is cached, because we don't want to fire a SELECT call every time the code wants to know
  #   whether some random user is a WST or WCAT member.
  # So if the server after booting loads all T/Cs once, then during server runtime somebody adds a new member
  #   to one particular team, the cached instance from boot time would still hold the old `user_group`
  #   and thus the old memberships.
  # The `touch` makes it so that a small change to the metadata is written, which triggers an `after_commit` hook
  #   in our custom caching mechanism (see also concerns/cachable.rb)
  belongs_to :metadata, polymorphic: true, optional: true, touch: true
  belongs_to :parent_group, class_name: "UserGroup", optional: true

  scope :root_groups, -> { where(parent_group: nil) }
  scope :active_groups, -> { where(is_active: true) }

  validates :active_roles, absence: true, unless: :is_active?

  def all_child_groups
    [direct_child_groups, direct_child_groups.map(&:all_child_groups)].flatten
  end

  def all_child_roles
    self.all_child_groups.map(&:roles).flatten
  end

  def active_all_child_roles
    self.all_child_groups.map(&:active_roles).flatten
  end

  def all_child_users
    self.all_child_roles.map(&:user)
  end

  def active_all_child_users
    self.active_all_child_roles.map(&:user)
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
      banned_competitors: "Banned Competitors",
    }
  end

  def self.teams_committees_group_wct
    GroupsMetadataTeamsCommittees.wct.user_group
  end

  def self.teams_committees_group_wcat
    GroupsMetadataTeamsCommittees.wcat.user_group
  end

  def self.teams_committees_group_wic
    GroupsMetadataTeamsCommittees.wic.user_group
  end

  def self.teams_committees_group_wdpc
    GroupsMetadataTeamsCommittees.wdpc.user_group
  end

  def self.teams_committees_group_weat
    GroupsMetadataTeamsCommittees.weat.user_group
  end

  def self.teams_committees_group_wfc
    GroupsMetadataTeamsCommittees.wfc.user_group
  end

  def self.teams_committees_group_wmt
    GroupsMetadataTeamsCommittees.wmt.user_group
  end

  def self.teams_committees_group_wqac
    GroupsMetadataTeamsCommittees.wqac.user_group
  end

  def self.teams_committees_group_wrc
    GroupsMetadataTeamsCommittees.wrc.user_group
  end

  def self.teams_committees_group_wrt
    GroupsMetadataTeamsCommittees.wrt.user_group
  end

  def self.teams_committees_group_wst
    GroupsMetadataTeamsCommittees.wst.user_group
  end

  def self.teams_committees_group_wst_admin
    GroupsMetadataTeamsCommittees.wst_admin.user_group
  end

  def self.teams_committees_group_wct_china
    GroupsMetadataTeamsCommittees.wct_china.user_group
  end

  def self.teams_committees_group_wat
    GroupsMetadataTeamsCommittees.wat.user_group
  end

  def self.teams_committees_group_wsot
    GroupsMetadataTeamsCommittees.wsot.user_group
  end

  def self.teams_committees_group_wapc
    GroupsMetadataTeamsCommittees.wapc.user_group
  end

  def self.banned_competitors_group
    UserGroup.banned_competitors.first
  end

  def self.board_group
    GroupsMetadataBoard.singleton_metadata.user_group
  end

  def senior_delegate
    if parent_group_id.nil?
      self.lead_user
    else
      parent_group.senior_delegate
    end
  end

  def lead_role
    active_roles.includes(:group, :metadata).find(&:lead?)
  end

  # TODO: Once the roles migration is done, add a validation to make sure there is only one lead_user per group.
  def lead_user
    lead_role&.user
  end

  # Unique status means that there can only be one active user with this status in the group.
  def unique_status?(status)
    if self.group_type == UserGroup.group_types[:delegate_regions]
      %w[senior_delegate regional_delegate].include?(status)
    elsif [UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]].include?(self.group_type)
      status == "leader"
    else
      false
    end
  end

  def root_group?
    parent_group_id.nil?
  end

  def root_group
    parent_group&.root_group || self
  end

  def self.roles_of_group_type(group_type, includes_params: [])
    UserRole.includes(:group).includes(includes_params).where(group: { group_type: group_type })
  end

  def email
    metadata&.email
  end

  def readable_by?(user)
    return true unless is_hidden

    return false if user.nil?

    permission = is_active ? :can_read_groups_current : :can_read_groups_past
    user.has_permission?(permission, id)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  private def end_active_lead_roles
    active_roles.select(&:lead?).each { |role| role.update!(end_date: Date.today) }
    # Since `active_roles` is loading the data based on timestamps, the
    # association may currently be loaded based on older timestamps. We have
    # just changed some of the timestamps in the update calls above, so
    # force-reset the association to ensure time-accurate data.
    active_roles.reset
  end
end
