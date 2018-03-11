class VenueRoom < ApplicationRecord
  belongs_to :schedule_venue
  has_one :competition_schedule, through: :schedule_venue
  delegate :start_time, to: :competition_schedule
  delegate :end_time, to: :competition_schedule
  has_many :schedule_activities, as: :holder

  validates_presence_of :name
end
