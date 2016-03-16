class TeamMember < ActiveRecord::Base
  belongs_to :team
  belongs_to :user

  attr_accessor :current_user

  validate :cannot_demote_leader
  def cannot_demote_leader
    if end_date != nil && end_date < Date.today && team_leader
      errors.add(:end_date, "A team leader must be a current member.")
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && end_date != nil && end_date < Date.today
      errors.add(:user_id, "You cannot demote yourself.")
    end
  end
end
