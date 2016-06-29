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

  MAX_ID_LENGTH = 6
  MAX_NAME_LENGTH = 54
  MAX_FORMAT_LENGTH = 10
  MAX_CELLNAME_LENGTH = 45
  validates :id, presence: true, uniqueness: true, length: { maximum: MAX_ID_LENGTH }
  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }
  validates :rank, numericality: { only_integer: true }
  validates :format, presence: true, length: { maximum: MAX_FORMAT_LENGTH }
  validates :cellName, presence: true, uniqueness: true, length: { maximum: MAX_CELLNAME_LENGTH }

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
