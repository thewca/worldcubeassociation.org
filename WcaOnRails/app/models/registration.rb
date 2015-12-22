class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  enum status: { accepted: "a", pending: "p" }

  belongs_to :competition, foreign_key: "competitionId"
  belongs_to :user
  validates :user, presence: true, on: [:create]

  def events
    (eventIds || "").split.map { |e| Event.find_by_id(e) }.sort_by &:rank
  end

  def name
    user ? user.name : read_attribute(:name)
  end

  attr_writer :birthday
  def birthday
    if user
      user.dob
    else
      birthYear == 0 || birthMonth == 0 || birthDay == 0 ? nil : Date.new(birthYear, birthMonth, birthDay)
    end
  end

  def gender
    user ? user.gender : read_attribute(:gender)
  end

  def countryId
    if user
      country = Country.find_by_iso2(user.country_iso2)
      if country
        return country.id
      end
    end
    read_attribute(:countryId)
  end

  def email
    user ? user.email : read_attribute(:email)
  end

  def personId
    user ? user.wca_id : read_attribute(:personId)
  end

  def waiting_list_info
    pending_registrations = competition.registrations.pending.order(:created_at)
    index = pending_registrations.index(self)
    OpenStruct.new(index: index, length: pending_registrations.length)
  end

  validate :user_can_register_for_competition
  private def user_can_register_for_competition
    if user && user.cannot_register_for_competition_reasons.length > 0
      errors.add(:user_id, "User must be able to register for competition")
    end
  end

  validate :must_register_for_gte_one_event
  private def must_register_for_gte_one_event
    if events.length == 0
      errors.add(:events, "must register for at least one event")
    end
  end

  validate :events_must_be_offered
  private def events_must_be_offered
    if !competition
      errors.add(:competitionId, "invalid")
      return
    end
    invalid_events = events - competition.events
    unless invalid_events.empty?
      errors.add(:events, "invalid event ids: #{invalid_events.map(&:id).join(',')}")
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
