# frozen_string_literal: true
class TeamMember < ActiveRecord::Base
  belongs_to :team
  belongs_to :user
  belongs_to :committee_position
  has_one :committee, through: :team

  scope :current, -> { where("end_date IS NULL OR end_date > ?", Date.today) }

  def senior_delegate?
    self.current_member? && self.committee.slug == Committee::WCA_DELEGATES_COMMITTEE && self.committee_position.slug == 'senior-delegate'
  end

  def committee_member?(committee_slug)
    self.committee.slug == committee_slug
  end

  attr_accessor :current_user

  def current_member?
    end_date == nil || end_date > Date.today
  end

  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if start_date && end_date && start_date >= end_date
      errors.add(:start_date, "must be earlier than end date")
    end
  end

  validate :membership_periods_cannot_overlap_for_single_user
  def membership_periods_cannot_overlap_for_single_user
    if start_date
      self_period = start_date..(end_date || Date::Infinity.new)
      other_members = team.team_members.where(user_id: user_id).where.not(id: id)
      other_members.each do |team_member|
        other_period = team_member.start_date..(team_member.end_date || Date::Infinity.new)
        if self_period.overlaps? other_period
          errors.add(:user_id, "must not have overlapping membership dates with the #{self.team.name}.")
        end
      end
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && !current_member?
      errors.add(:user_id, "You cannot demote yourself")
    end
  end

  validate :delegate_team_must_have_at_least_one_senior_delegate
  def delegate_team_must_have_at_least_one_senior_delegate
    if committee_member?(Committee::WCA_DELEGATES_COMMITTEE) && !self.senior_delegate?
      senior_delegate_count = 0
      team.current_members.each do |team_member|
        if team_member.committee_position.slug == 'senior-delegate' && self.id != team_member.id
          senior_delegate_count += 1
        end
      end
      if senior_delegate_count == 0
        errors.add(:committee_position_id, "must have one senior delegate for each delegate team. If you are demoting this member, create a new senior delegate first.")
      end
    end
  end

  validate :committee_position_is_part_of_team_members_committee
  def committee_position_is_part_of_team_members_committee
    if !self.team.committee.committee_positions.ids.include? self.committee_position_id
      errors.add(:committee_position_id, "must be a position from the committee this team member is part of")
    end
  end

  validates :start_date, presence: true
  validates :user, presence: true
  validates :team, presence: true
  validates :start_date, presence: true
  validates :committee_position, presence: true
end
