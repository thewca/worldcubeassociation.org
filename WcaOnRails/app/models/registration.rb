class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  enum status: { accepted: "a", pending: "p" }


  validate :events_must_be_offered

  before_validation :unpack_dates
  before_save :normalize_event_ids

  belongs_to :competition, foreign_key: "competitionId"

  def events
    (eventIds || "").split.map { |e| Event.find_by_id(e) }.sort_by &:rank
  end

  attr_writer :birthday
  def birthday
    birthYear == 0 || birthMonth == 0 || birthDay == 0 ? nil : Date.new(birthYear, birthMonth, birthDay)
  end

  private def events_must_be_offered
    if !competition
      errors.add(:competitionId, "invalid")
      return
    end
    invalid_events = events - competition.events
    unless invalid_events.empty?
      errors.add(:eventIds, "invalid event ids: #{invalid_events.map(&:id).join(',')}")
    end
  end

  private def normalize_event_ids
    self.eventIds = events.map(&:id).join(" ")
  end

  private def unpack_dates
    if @birthday.nil? && !birthday.blank?
      @birthday = birthday.strftime("%F")
    end
    if @birthday.blank?
      self.birthYear = self.birthMonth = self.birthDay = 0
    else
      unless /\A\d{4}-\d{2}-\d{2}\z/.match(@birthday)
        errors.add(:birthday, "invalid")
        return
      end
      self.birthYear, self.birthMonth, self.birthDay = @birthday.split("-").map(&:to_i)
      unless Date.valid_date? self.birthYear, self.birthMonth, self.birthDay
        errors.add(:birthday, "invalid")
        return
      end
    end
  end
end
