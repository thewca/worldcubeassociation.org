class CompetitionSchedule < ApplicationRecord
  belongs_to :competition
  has_many :schedule_venues, dependent: :destroy
  # TODO: all activities

  validates_presence_of :start_date
  validates_numericality_of :number_of_days, greater_than: 0
  validate :includes_competition_dates

  def start_time
    start_date.to_datetime
  end

  def end_time
    (end_date+1).to_datetime
  end

  def end_date
    start_date + number_of_days - 1
  end

  def includes_competition_dates
    # We assume start_date is present and number_of_days is a positive integer
    return unless errors.blank?
    # FIXME: add a reasonable +- window?
    unless start_date <= competition.start_date
      errors.add(:start_date, "should start before or on the same day of the competition")
    end
    unless end_date >= competition.end_date
      errors.add(:number_of_days, "should include the whole competition")
    end
  end
end
