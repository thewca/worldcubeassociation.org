class ScheduleVenue < ApplicationRecord
  belongs_to :competition_schedule
  has_many :venue_rooms, dependent: :destroy
end
