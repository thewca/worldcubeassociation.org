# frozen_string_literal: true
class Vote < ActiveRecord::Base

  belongs_to :user
  belongs_to :poll

  has_many :vote_options
  has_many :poll_options, through: :vote_options

  validate :poll_id_must_be_valid
  def poll_id_must_be_valid
    if !poll
      errors.add(:poll_id, "is not valid")
    end
  end

  validate :option_must_match_poll
  def option_must_match_poll
    if poll_options.any? { |o| o.poll_id != poll_id }
      errors.add(:poll_options, "One or more poll_options don't match the poll")
    end
  end

  validate :must_have_at_least_one_option
  def must_have_at_least_one_option
    if poll_options.empty?
      errors.add(:poll_options, "can't be empty")
    end
  end

  validate :number_of_options_must_match_poll
  def number_of_options_must_match_poll
    if poll && !poll.multiple && poll_options.length > 1
      errors.add(:poll_options, "you must choose just one option")
    end
  end

  validate :poll_must_be_confirmed
  def poll_must_be_confirmed
    if poll && !poll.confirmed?
      errors.add(:poll_id, "poll is not confirmed")
    end
  end

  validate :poll_must_still_be_open
  def poll_must_still_be_open
    if poll && poll.over?
      errors.add(:poll_id, "poll is closed")
    end
  end

end
