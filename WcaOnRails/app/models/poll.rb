# frozen_string_literal: true
class Poll < ActiveRecord::Base

  has_many :poll_options, dependent: :destroy
  has_many :votes

  validates :question, presence: true
  validate :deadline_cannot_be_in_the_past, on: [:create]

  # Validations for confirming a poll
  validate :must_have_at_least_two_options, if: :confirmed?
  def must_have_at_least_two_options
    if self.poll_options.reject(&:marked_for_destruction?).length < 2
      errors.add(:poll_options, "Poll must have at least two options")
    end
  end

  validate :can_only_edit_deadline_after_confirming
  def can_only_edit_deadline_after_confirming
    if confirmed_at_was && self.changed != ['deadline']
      errors.add(:deadline, "you can only change the deadline")
    end
  end

  accepts_nested_attributes_for :poll_options, reject_if: :all_blank, allow_destroy: true

  def deadline_cannot_be_in_the_past
    if deadline.present? && deadline < Date.today
      errors.add(:deadline, "can't be in the past")
    end
  end

  def over?
    deadline < Time.now
  end

  def user_already_voted?(current_user)
    self.votes.find_by_user_id(current_user)
  end

  def confirmed?
    confirmed_at != nil
  end
end
