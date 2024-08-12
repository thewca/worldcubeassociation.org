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
  has_many :roles, foreign_key: "group_id", class_name: "UserRole"
  has_many :active_roles, -> { active }, foreign_key: "group_id", class_name: "UserRole"
  has_many :direct_child_roles, through: :direct_child_groups, source: :roles
  has_many :active_direct_child_roles, -> { active }, through: :direct_child_groups, source: :roles
  has_many :users, through: :roles
  has_many :active_users, through: :active_roles, source: :user
  has_many :direct_child_users, through: :direct_child_roles, source: :user
  has_many :active_direct_child_users, through: :active_direct_child_roles, source: :user

  belongs_to :metadata, polymorphic: true, optional: true
  belongs_to :parent_group, class_name: "UserGroup", optional: true

  scope :root_groups, -> { where(parent_group: nil) }
  scope :active_groups, -> { where(is_active: true) }

  validates :active_roles, absence: true, unless: :is_active?

  # This is important because we generally access "semantic" UserGroups
  # (ie T/Cs, DelegateRegions, Translators) etc. by metadata. This metadata usually has an `user_group`
  # association defined, and Rails uses caching on that. So if the server after booting loads all T/Cs once,
  # then during server runtime somebody adds a new member to one particular team, the cached instance from boot time
  # still holds the old `user_group` and thus the old memberships.
  #
  # This commit hook makes it so that whenever a change happens, we reset the metadata
  # so that it finds the newest changes even in cache mode (reset_* methods are provided by Rails magically.)
  after_commit :reset_metadata, on: [:update, :destroy]

  private def reset_metadata
    return unless self.metadata.present?

    metadata_cachable = self.metadata.class < Cachable
    metadata_has_assoc = self.metadata.class.reflect_on_association(:user_group).present?

    if metadata_cachable && metadata_has_assoc
      self.metadata.as_cached.reset_user_group
    end
  end

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
    self.all_child_roles.map { |role| role.user }
  end

  def active_all_child_users
    self.active_all_child_roles.map { |role| role.user }
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

  def self.teams_committees_group_wdc
    GroupsMetadataTeamsCommittees.wdc.user_group
  end

  def self.teams_committees_group_wdpc
    GroupsMetadataTeamsCommittees.wdpc.user_group
  end

  def self.teams_committees_group_wec
    GroupsMetadataTeamsCommittees.wec.user_group
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

  def self.council_group_wac
    GroupsMetadataCouncils.find_by(friendly_id: 'wac').user_group
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
    active_roles.includes(:group, :metadata).find { |role| role.is_lead? }
  end

  # TODO: Once the roles migration is done, add a validation to make sure there is only one lead_user per group.
  def lead_user
    lead_role&.user
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

  def self.roles_of_group_type(group_type, includes_params: [])
    UserRole.includes(:group).includes(includes_params).where(group: { group_type: group_type })
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  # rubocop:disable Metrics/PerceivedComplexity
  def changes_in_group_for_digest
    duration_start_date = Time.now.beginning_of_month - 1.month
    sorted_users = []
    team_member_changes = {}

    leader_appointments = []
    no_more_leaders = []
    promoted_senior_members = []
    new_senior_members = []
    new_members = []
    demoted_senior_members = []
    no_more_senior_members = []
    no_more_members = []

    roles
      .select { |role| role.updated_at >= duration_start_date } # Filters members who have change in the duration.
      .sort_by { |role| [role.user.name, role.updated_at] } # Sorts the members alphabetically.
      .each do |role|
        user = role.user
        if sorted_users.count == 0 || sorted_users.last.id != user.id
          sorted_users.append(user)
          team_member_changes[user.id] = [role]
        else
          team_member_changes[user.id].append(role)
        end
      end
    sorted_users.each do |user|
      new_leader = false
      new_senior_member = false
      new_member = false
      ex_leader = false
      ex_senior_member = false
      ex_member = false
      new_and_ex_leader = false
      new_and_ex_senior_member = false
      new_and_ex_member = false

      # Creates flags for what all actioned in the duration.
      team_member_changes[user.id].each do |member|
        if member.end_date && member.end_date >= duration_start_date
          if member.start_date >= duration_start_date
            new_and_ex_leader = member.metadata.status == 'leader'
            new_and_ex_senior_member = member.metadata.status == 'senior_member'
            new_and_ex_member = !new_and_ex_leader && !new_and_ex_senior_member
          else
            ex_leader = member.metadata.status == 'leader'
            ex_senior_member = member.metadata.status == 'senior_member'
            ex_member = !ex_leader && !ex_senior_member
          end
        elsif !member.end_date && member.start_date >= duration_start_date
          new_leader = member.metadata.status == 'leader'
          new_senior_member = member.metadata.status == 'senior_member'
          new_member = !new_leader && !new_senior_member
        end
      end

      # Gets assigned to respective group of changes
      name = user.name
      if new_leader || ex_leader || new_and_ex_leader
        if new_leader
          leader_appointments.append("#{name} has been appointed as the new Leader.")
        elsif ex_leader
          if new_member
            no_more_leaders.append("#{name} is no longer the Leader, but will continue as member.")
          elsif new_senior_member
            no_more_leaders.append("#{name} is no longer the Leader, but will continue as Senior member.")
          else
            no_more_leaders.append("#{name} is no longer the Leader and no longer a member.")
          end
        else
          if new_member
            no_more_leaders.append("#{name} was the Leader for few days and is continuing as member.")
          elsif new_senior_member
            no_more_leaders.append("#{name} was the Leader for few days and is continuing as Senior member.")
          else
            no_more_leaders.append("#{name} was the Leader for few days and is no longer a member.")
          end
        end
      else
        if new_senior_member || new_and_ex_senior_member
          if ex_member || new_and_ex_member
            promoted_senior_members.append(name)
          else
            new_senior_members.append(name)
          end
        end
        if new_member || new_and_ex_member
          if !ex_senior_member && !new_and_ex_senior_member
            new_members.append(name)
          else
            demoted_senior_members.append(name)
          end
        elsif ex_senior_member || new_and_ex_senior_member
          no_more_senior_members.append(name)
        end
        if (ex_member || new_and_ex_member) && !new_senior_member && !new_member
          no_more_members.append(name)
        end
      end
    end

    changes_of_last_month = []
    if leader_appointments.count + no_more_leaders.count + promoted_senior_members.count + new_senior_members.count + new_members.count + demoted_senior_members.count + no_more_senior_members.count + no_more_members.count > 0
      changes_of_last_month.push("<br><b>Changes in #{self.name}</b>")
      if leader_appointments.count + no_more_leaders.count > 0
        changes_of_last_month.push("<br><b>Leaders</b>")
        if leader_appointments.count > 0
          changes_of_last_month.push(leader_appointments.join("<br>"))
        end
        if no_more_leaders.count > 0
          changes_of_last_month.push(no_more_leaders.join("<br>"))
        end
      end
      if promoted_senior_members.count > 0
        changes_of_last_month.push("<br><b>Promoted Senior Members</b><br>#{promoted_senior_members.join("<br>")}")
      end
      if new_senior_members.count > 0
        changes_of_last_month.push("<br><b>New Senior Members</b><br>#{new_senior_members.join("<br>")}")
      end
      if new_members.count > 0
        changes_of_last_month.push("<br><b>New Members</b><br>#{new_members.join("<br>")}")
      end
      if demoted_senior_members.count > 0
        changes_of_last_month.push("<br><b>Demotions from Senior Member to Member</b><br>#{demoted_senior_members.join("<br>")}")
      end
      if no_more_senior_members.count > 0
        changes_of_last_month.push("<br><b>Resigned/Demoted Senior Members</b><br>#{no_more_senior_members.join("<br>")}")
      end
      if no_more_members.count > 0
        changes_of_last_month.push("<br><b>Resigned/Demoted Members</b><br>#{no_more_members.join("<br>")}")
      end
    end
    changes_of_last_month.join("<br>")
  end
  # rubocop:enable Metrics/CyclomaticComplexity
  # rubocop:enable Metrics/PerceivedComplexity

  def self.changes_in_groups_for_digest
    group_changes = []
    [UserGroup.teams_committees, UserGroup.councils].flatten!.each do |group|
      current_group_changes = group.changes_in_group_for_digest
      if !current_group_changes.empty?
        group_changes.push(current_group_changes)
      end
    end
    if group_changes.empty?
      group_changes.push("There are no changes to show.")
    end
    group_changes.join("<br>")
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
    methods: %w[lead_user],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
