# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"
  has_one :leader, -> { current_leader }, class_name: "TeamMember"

  default_scope -> { where(hidden: false) }
  scope :with_hidden, -> { unscope(where: :hidden) }

  accepts_nested_attributes_for :team_members, reject_if: :all_blank, allow_destroy: true

  validate :membership_periods_cannot_overlap_for_single_user
  def membership_periods_cannot_overlap_for_single_user
    team_members.select(&:valid?).reject(&:marked_for_destruction?).group_by(&:user).each do |user, memberships|
      memberships.combination(2).to_a.each do |memberships_pair|
        first, second = memberships_pair
        first_period = first.start_date..(first.end_date || Date::Infinity.new)
        second_period = second.start_date..(second.end_date || Date::Infinity.new)
        if first_period.overlaps? second_period
          errors.add(:base, message: "Membership periods overlap for user #{user.name}")
          break # One overlapping period for the user is found, skip to the next one
        end
      end
    end
  end

  # Code duplication from Cachable concern, as we index by friendly_id and not by id :(
  def self.c_all_by_friendly_id
    @@teams_by_friendly_id ||= nil
    @@teams_by_friendly_id_timestamp ||= nil

    if @@teams_by_friendly_id_timestamp.nil? || @@teams_by_friendly_id_timestamp < 15.minutes.ago
      @@teams_by_friendly_id = all.with_hidden.index_by(&:friendly_id)
      @@teams_by_friendly_id_timestamp = DateTime.now
    end

    @@teams_by_friendly_id
  end

  def self.c_find_by_friendly_id!(friendly_id)
    self.c_all_by_friendly_id[friendly_id] || raise("friendly id not found #{friendly_id}")
  end

  def self.wrc
    Team.c_find_by_friendly_id!('wrc')
  end

  def self.wst
    Team.c_find_by_friendly_id!('wst')
  end

  def self.banned
    Team.c_find_by_friendly_id!('banned')
  end

  def self.wdpc
    Team.c_find_by_friendly_id!('wdpc')
  end

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
  end

  def group
    GroupsMetadataTeamsCommittees.find_by(friendly_id: self.friendly_id)&.user_group
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id friendly_id name email],
    methods: %w[name acronym current_members],
    include: [],
  }.freeze

  def serializable_hash(options = nil)
    # NOTE: doing deep_dup is necessary here to avoid changing the inner values
    # of the freezed variables (which would leak PII)!
    default_options = DEFAULT_SERIALIZE_OPTIONS.deep_dup
    options = default_options.merge(options || {})
    super(options)
  end

  def self.changes_in_all_teams
    team_changes = []
    all_teams = UserGroup.teams_committees.select { |team_committee| !team_committee.roles_migrated? && team_committee.team.present? }.map(&:team) + UserGroup.councils.map(&:team)
    all_teams.each do |team|
      current_team_changes = team.changes_in_team
      if !current_team_changes.empty?
        team_changes.push(current_team_changes)
      end
    end
    if team_changes.empty?
      team_changes.push("There are no changes to show.")
    end
    team_changes.join("<br>")
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  # rubocop:disable Metrics/PerceivedComplexity
  def changes_in_team
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

    team_members
      .select { |team_member| team_member.updated_at >= duration_start_date } # Filters members who have change in the duration.
      .sort_by { |team_member| [team_member.user.name, team_member.updated_at] } # Sorts the members alphabetically.
      .each do |team_member|
        user = team_member.user
        if sorted_users.count == 0 || sorted_users.last.id != user.id
          sorted_users.append(user)
          team_member_changes[user.id] = [team_member]
        else
          team_member_changes[user.id].append(team_member)
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
            new_and_ex_leader = member.team_leader
            new_and_ex_senior_member = member.team_senior_member
            new_and_ex_member = !new_and_ex_leader && !new_and_ex_senior_member
          else
            ex_leader = member.team_leader
            ex_senior_member = member.team_senior_member
            ex_member = !ex_leader && !ex_senior_member
          end
        elsif !member.end_date && member.start_date >= duration_start_date
          new_leader = member.team_leader
          new_senior_member = member.team_senior_member
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
      changes_of_last_month.push("<b>Changes in #{self.name}</b>")
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
end
