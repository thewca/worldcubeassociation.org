class CompetitionSchedule < ApplicationRecord
  belongs_to :competition
  has_many :schedule_venues, dependent: :destroy
end
