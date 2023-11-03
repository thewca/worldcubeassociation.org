# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"
  has_one :leader, -> { current_leader }, class_name: "TeamMember"

  default_scope -> { where(hidden: false) }
  scope :with_hidden, -> { unscope(where: :hidden) }

  scope :official, -> { where(id: Team.all_official.map(&:id)) }

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

  # "Official" teams are teams recognized by Motion "10.2019.0":
  #  https://www.worldcubeassociation.org/documents/motions/10.2019.0%20-%20Committees%20and%20Teams.pdf
  # Motions starting with "10.YYYY.N" define these teams:
  #  https://www.worldcubeassociation.org/documents
  def self.all_official
    [
      Team.wct,
      Team.wcat,
      Team.wdc,
      Team.wec,
      Team.weat,
      Team.wfc,
      Team.wmt,
      Team.wqac,
      Team.wrc,
      Team.wrt,
      Team.wst,
      Team.wsot,
      Team.wat,
    ]
  end

  # Councils are recognized by Motion "20.2019.0":
  #  https://www.worldcubeassociation.org/documents/motions/20.2019.0%20-%20Councils.pdf
  # Motions starting with "20.YYYY.N" define these councils:
  #  https://www.worldcubeassociation.org/documents
  def self.all_councils
    [
      Team.wac,
    ]
  end

  def self.all_official_and_councils
    self.all_official + self.all_councils
  end

  # Don't forget that the WFC Leader is an officer too, the WCA Treasurer!
  def self.all_officers
    [
      Team.chair,
      Team.executive_director,
      Team.secretary,
      Team.vice_chair,
    ]
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

  def self.board
    Team.c_find_by_friendly_id!('board')
  end

  def self.chair
    Team.c_find_by_friendly_id!('chair')
  end

  def self.executive_director
    Team.c_find_by_friendly_id!('executive_director')
  end

  def self.secretary
    Team.c_find_by_friendly_id!('secretary')
  end

  def self.vice_chair
    Team.c_find_by_friendly_id!('vice_chair')
  end

  def self.wct
    Team.c_find_by_friendly_id!('wct')
  end

  def self.wct_china
    Team.c_find_by_friendly_id!('wct_china')
  end

  def self.wdc
    Team.c_find_by_friendly_id!('wdc')
  end

  def self.wec
    Team.c_find_by_friendly_id!('wec')
  end

  def self.weat
    Team.c_find_by_friendly_id!('weat')
  end

  def self.wfc
    Team.c_find_by_friendly_id!('wfc')
  end

  def self.wqac
    Team.c_find_by_friendly_id!('wqac')
  end

  def self.wrc
    Team.c_find_by_friendly_id!('wrc')
  end

  def self.wrt
    Team.c_find_by_friendly_id!('wrt')
  end

  def self.wst
    Team.c_find_by_friendly_id!('wst')
  end

  def self.wst_admin
    Team.c_find_by_friendly_id!('wst_admin')
  end

  def self.banned
    Team.c_find_by_friendly_id!('banned')
  end

  def self.wcat
    Team.c_find_by_friendly_id!('wcat')
  end

  def self.wmt
    Team.c_find_by_friendly_id!('wmt')
  end

  def self.wdpc
    Team.c_find_by_friendly_id!('wdpc')
  end

  def self.wac
    Team.c_find_by_friendly_id!('wac')
  end

  def self.wsot
    Team.c_find_by_friendly_id!('wsot')
  end

  def self.wat
    Team.c_find_by_friendly_id!('wat')
  end

  def official?
    Team.all_official.include?(self)
  end

  def council?
    Team.all_councils.include?(self)
  end

  def official_or_council?
    Team.all_official_and_councils.include?(self)
  end

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
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
    all_teams = Team.all_official_and_councils
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
