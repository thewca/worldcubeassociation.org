class TeamMember < ActiveRecord::Base
  belongs_to :team
  belongs_to :user

  attr_accessor :current_user

  def current_member?
    end_date == nil || end_date > Date.today
  end

  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if end_date != nil && start_date >= end_date
      errors.add(:start_date, " must be earlier than end_date.")
    end
  end

  validate :cannot_demote_leader
  def cannot_demote_leader
    if !current_member? && team_leader
      errors.add(:end_date, "A team leader must be a current member.")
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && !current_member?
      errors.add(:user_id, "You cannot demote yourself.")
    end
  end
end
