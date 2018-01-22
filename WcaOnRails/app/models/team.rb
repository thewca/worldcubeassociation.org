# frozen_string_literal: true

class Team < ApplicationRecord
  BOARD_FRIENDLY_ID = 'board'
  WCT_FRIENDLY_ID = 'wct'
  WDC_FRIENDLY_ID = 'wdc'
  WEC_FRIENDLY_ID = 'wec'
  WFC_FRIENDLY_ID = 'wfc'
  WQAC_FRIENDLY_ID = 'wqac'
  WRC_FRIENDLY_ID = 'wrc'
  WRT_FRIENDLY_ID = 'wrt'
  WST_FRIENDLY_ID = 'wst'

  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"

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

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
  end
end
