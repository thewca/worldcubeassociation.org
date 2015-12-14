class Poll < ActiveRecord::Base

  has_many :poll_options, foreign_key: "poll_id"
  has_many :votes, foreign_key: "poll_id"

  validates :question, presence: true
  validate :deadline_cannot_be_in_the_past, on: [:create]

  # Validations for confirming a poll
  validate :must_have_at_least_two_options, if: :confirmed?
  def must_have_at_least_two_options
    if self.poll_options.length < 2
      errors.add(:poll_options, "Poll must have at least two options")
    end
  end

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
    self.votes.find_by(user_id: user.id) != nil
  end
end
