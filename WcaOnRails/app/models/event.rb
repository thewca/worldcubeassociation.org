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

  scope :all_official, -> { where("rank < 990").order(:rank) }
  scope :all_deprecated, -> { where("rank between 990 and 999").order(:rank) }
  scope :all_never_were_official, -> { where("rank >= 1000").order(:rank) }

  def recommended_format
    formats.recommended.first
  end

  def official?
    rank < 990
  end

  def deprecated?
    rank >= 990 && rank < 1000
  end

  def never_was_official?
    rank >= 1000
  end
end
