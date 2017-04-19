# frozen_string_literal: true

class TeamMember < ApplicationRecord
  belongs_to :team
  belongs_to :user

  scope :current, -> { where("end_date IS NULL OR end_date > ?", Date.today) }

  attr_accessor :current_user

  def current_member?
    end_date.nil? || end_date > Date.today
  end

  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if start_date && end_date && start_date >= end_date
      errors.add(:start_date, "must be earlier than end_date")
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && !current_member?
      errors.add(:user_id, "You cannot demote yourself")
    end
  end

  validates :start_date, presence: true
  validates :user, presence: true
end
