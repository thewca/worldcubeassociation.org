# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"

  default_scope -> { where(hidden: false) }

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

  # Code duplication from Cachable concern, as we index by friendly_id and not by id :(
  def self.c_all_by_friendly_id
    @@teams_by_friendly_id ||= all.index_by(&:friendly_id)
  end

  def self.c_find_by_friendly_id!(friendly_id)
    self.c_all_by_friendly_id[friendly_id] || raise("id not found #{friendly_id}")
  end

  def self.board
    Team.c_find_by_friendly_id!('board')
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

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
  end
end
