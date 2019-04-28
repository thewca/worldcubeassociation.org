# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"

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
          errors[:base] << "Membership periods overlap for user #{user.name}"
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
      Team.wdpc,
      Team.wec,
      Team.wfc,
      Team.wmt,
      Team.wqac,
      Team.wrc,
      Team.wrt,
      Team.wst,
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
    @@teams_by_friendly_id ||= all.with_hidden.index_by(&:friendly_id)
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

  def self.wdc
    Team.c_find_by_friendly_id!('wdc')
  end

  def self.wec
    Team.c_find_by_friendly_id!('wec')
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

  def official?
    Team.all_official.include?(self)
  end

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
  end
end
