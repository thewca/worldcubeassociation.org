class CompetitionSchedule < ApplicationRecord
  belongs_to :competition
  delegate :start_date, to: :competition
  delegate :end_date, to: :competition
  has_many :schedule_venues, dependent: :destroy

  def number_of_days
    (end_date - start_date).to_i + 1
  end

  def start_time
    start_date.to_datetime
  end

  def end_time
    (end_date+1).to_datetime
  end

  def to_wcif
    {
      "startDate" => start_date,
      "numberOfDays" => start_date,
      "venues" => schedule_venues.map(&:to_wcif),
    }
  end
end
