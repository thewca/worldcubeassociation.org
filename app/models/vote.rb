# frozen_string_literal: true

class Vote < ApplicationRecord
  belongs_to :user
  belongs_to :poll

  has_many :vote_options
  has_many :poll_options, through: :vote_options

  validate :poll_id_must_be_valid
  def poll_id_must_be_valid
    errors.add(:poll_id, "is not valid") if !poll
  end

  validate :option_must_match_poll
  def option_must_match_poll
    errors.add(:poll_options, "One or more poll_options don't match the poll") if poll_options.any? { |o| o.poll_id != poll_id }
  end

  validate :must_have_at_least_one_option
  def must_have_at_least_one_option
    errors.add(:poll_options, "can't be empty") if poll_options.empty?
  end

  validate :number_of_options_must_match_poll
  def number_of_options_must_match_poll
    errors.add(:poll_options, "you must choose just one option") if poll && !poll.multiple && poll_options.length > 1
  end

  validate :poll_must_be_confirmed
  def poll_must_be_confirmed
    errors.add(:poll_id, "poll is not confirmed") if poll && !poll.confirmed?
  end

  validate :poll_must_still_be_open
  def poll_must_still_be_open
    errors.add(:poll_id, "poll is closed") if poll&.over?
  end
end
