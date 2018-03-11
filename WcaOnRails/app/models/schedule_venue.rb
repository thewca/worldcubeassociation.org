class ScheduleVenue < ApplicationRecord
  belongs_to :competition_schedule
  has_many :venue_rooms, dependent: :destroy

  VALID_TIMEZONES = ActiveSupport::TimeZone.all.map(&:name).freeze

  validates_presence_of :name
  validates_presence_of :latitude_microdegrees
  validates_presence_of :longitude_microdegrees
  validates_inclusion_of :timezone_id, in: VALID_TIMEZONES
end
