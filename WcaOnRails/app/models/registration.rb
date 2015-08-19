class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  validates :status, inclusion: { in: ["p", "a"] }

  belongs_to :competition, foreign_key: "competitionId"

  def events
    (eventIds || "").split.map { |e| Event.find_by_id(e) }.sort_by &:rank
  end

  def accepted?
    status == "a"
  end

  def pending?
    status == "p"
  end

  validate :events_must_be_offered
  private def events_must_be_offered
    invalid_events = events - competition.events
    unless invalid_events.empty?
      errors.add(:eventIds, "invalid event ids: #{invalid_events.map(&:id).join(',')}")
    end
  end

  before_save :normalize_event_ids
  private def normalize_event_ids
    self.eventIds = events.map(&:id).join(" ")
  end

  attr_writer :birthday
  def birthday
    birthYear == 0 || birthMonth == 0 || birthDay == 0 ? nil : Date.parse("%04i-%02i-%02i" % [ birthYear, birthMonth, birthDay ])
  end

  before_validation :unpack_dates
  private def unpack_dates
    if @birthday.nil? && !birthday.blank?
      @birthday = birthday.strftime("%F")
    end
    if @birthday.blank?
      self.birthYear = self.birthMonth = self.birthDay = 0
    else
      self.birthYear, self.birthMonth, self.birthDay = @birthday.split("-").map(&:to_i)
    end
  end

  validate :dates_must_be_valid
  private def dates_must_be_valid
    if self.birthYear == 0 && self.birthMonth == 0 && self.birthDay == 0
      # If the user left the date empty, that's a-okay.
      return
    end

    valid_dates = true
    unless !birthYear.nil? && !birthMonth.nil? && !birthDay.nil? && Date.valid_date?(birthYear, birthMonth, birthDay)
      valid_dates = false
      errors.add(:birthday, "invalid")
    end
  end
end
