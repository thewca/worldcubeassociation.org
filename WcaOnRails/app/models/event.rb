# frozen_string_literal: true
class Event < ActiveRecord::Base
  self.table_name = "Events"

  has_many :competitions_events
  has_many :competitions, through: :competition_events
  has_many :registration_events
  has_many :registrations, through: :registration_events
  has_many :user_preferred_events
  has_many :users, through: :user_preferred_events
  has_many :preferred_formats
  has_many :formats, through: :preferred_formats

  default_scope -> { order(:rank) }

  scope :official, -> { where("rank < 990") }
  scope :deprecated, -> { where("rank between 990 and 999") }
  scope :never_were_official, -> { where("rank >= 1000") }

  def recommended_format
    formats.recommended.first
  end

  def official?
    rank < 990
  end

  def deprecated?
    990 <= rank && rank < 1000
  end

  def never_was_official?
    rank >= 1000
  end
end
