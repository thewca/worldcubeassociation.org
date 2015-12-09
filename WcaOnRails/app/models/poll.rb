class Poll < ActiveRecord::Base

  has_many :poll_options, foreign_key: "poll_id"
  has_many :votes, through: :poll_options

  validates :question, presence: true  
  validate :deadline_cannot_be_in_the_past, on: [:create]

  accepts_nested_attributes_for :poll_options, reject_if: :all_blank, allow_destroy: true

  def deadline_cannot_be_in_the_past 
    if deadline.present? && deadline < Date.today
      errors.add(:deadline, "can't be in the past")
    end
  end

  def poll_is_over?
    deadline < Date.today
  end

  def user_already_voted?(user)
    (self.votes.find_by user_id: user.id) != nil
  end
end
