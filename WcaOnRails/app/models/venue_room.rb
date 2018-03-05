class VenueRoom < ApplicationRecord
  belongs_to :schedule_venue
  has_one :competition_schedule, through: :schedule_venue
  has_many :schedule_activities, as: :holder
end
