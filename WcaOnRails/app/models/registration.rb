class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  enum status: { accepted: "a", pending: "p" }

  belongs_to :competition, foreign_key: "competitionId"
  belongs_to :user
  validates :user, presence: true, on: [:create]

  def events
    (eventIds || "").split.map { |e| Event.find_by_id(e) }.sort_by &:rank
  end

  attr_writer :birthday
  def birthday
    birthYear == 0 || birthMonth == 0 || birthDay == 0 ? nil : Date.new(birthYear, birthMonth, birthDay)
  end

  before_validation :copy_user_info
  def copy_user_info
    return if !user
    self.name = user.name
    self.birthday = user.dob
    self.countryId = user.country_iso2
    self.gender = user.gender
    self.email = user.email # TODO - user_id would be way more useful here
    self.personId = user.wca_id
    # TODO - we don't need ip anymore now that we have users accounts
  end

  validate :events_must_be_offered
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

  before_save :normalize_event_ids
  private def normalize_event_ids
    self.eventIds = events.map(&:id).join(" ")
  end

  before_validation :unpack_dates
  private def unpack_dates
    if @birthday.nil? && !birthday.blank?
      @birthday = birthday.strftime("%F")
    end
    if @birthday.blank?
      self.birthYear = self.birthMonth = self.birthDay = 0
    else
      if @birthday.is_a? Date
        self.birthYear = @birthday.year
        self.birthMonth = @birthday.month
        self.birthDay = @birthday.day
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
end
