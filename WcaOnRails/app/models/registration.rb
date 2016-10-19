# frozen_string_literal: true
class Registration < ActiveRecord::Base
  scope :pending, -> { where(accepted_at: nil) }
  scope :accepted, -> { where.not(accepted_at: nil) }

  belongs_to :competition, foreign_key: "competitionId"
  belongs_to :user
  has_many :registration_competition_events
  has_many :competition_events, through: :registration_competition_events
  has_many :events, through: :competition_events

  accepts_nested_attributes_for :registration_competition_events, allow_destroy: true

  validates :user, presence: true, on: [:create]

  validates_numericality_of :guests, greater_than_or_equal_to: 0

  validate :competition_must_use_wca_registration
  private def competition_must_use_wca_registration
    if !competition
      errors.add(:competition, I18n.t('registrations.errors.comp_not_found'))
    elsif !competition.use_wca_registration?
      errors.add(:competition, I18n.t('registrations.errors.registration_closed'))
    end
  end

  def pending?
    accepted_at.nil?
  end

  def accepted?
    !pending?
  end

  def name
    user&.name || read_attribute(:name)
  end

  attr_accessor :pos
  attr_accessor :tied_previous

  attr_writer :birthday
  def birthday
    if user
      user.dob
    else
      birthYear == 0 || birthMonth == 0 || birthDay == 0 ? nil : Date.new(birthYear, birthMonth, birthDay)
    end
  end

  def gender
    user&.gender || read_attribute(:gender)
  end

  def countryId
    user&.country&.id || read_attribute(:countryId)
  end

  def email
    user&.email || read_attribute(:email)
  end

  def personId
    user&.wca_id || read_attribute(:personId)
  end
  alias_method :wca_id, :personId

  def person
    Person.find_by_wca_id(personId)
  end

  def world_rank(event, type)
    person&.world_rank(event, type)
  end

  def best_solve(event, type)
    person&.best_solve(event, type) || SolveTime.new(event.id, type, 0)
  end

  # Since Registration.events only includes saved events
  # this method is required to ensure that in any forms which
  # select events, unsaved events are still presented if
  # there are any validation issues on the form.
  def saved_and_unsaved_events
    registration_competition_events.
      joins(:competition_event).
      joins(:event).
      reject(&:marked_for_destruction?).
      map(&:event).
      sort_by(&:rank)
  end

  def waiting_list_info
    pending_registrations = competition.registrations.pending.order(:created_at)
    index = pending_registrations.index(self)
    OpenStruct.new(index: index, length: pending_registrations.length)
  end

  validate :user_can_register_for_competition
  private def user_can_register_for_competition
    if user&.cannot_register_for_competition_reasons.present?
      errors.add(:user_id, I18n.t('registrations.errors.can_register'))
    end
  end

  validate :must_register_for_gte_one_event
  private def must_register_for_gte_one_event
    if registration_competition_events.reject(&:marked_for_destruction?).empty?
      errors.add(:registration_competition_events, I18n.t('registrations.errors.must_register'))
    end
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
          errors.add(:birthday, I18n.t('common.errors.invalid'))
          return
        end
        self.birthYear, self.birthMonth, self.birthDay = @birthday.split("-").map(&:to_i)
        unless Date.valid_date? self.birthYear, self.birthMonth, self.birthDay
          errors.add(:birthday, I18n.t('common.errors.invalid'))
          return
        end
      end
    end
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_event = competition.competition_events.find_by!(event: event)
      registration_competition_events.find_by_competition_event_id(competition_event.id) || registration_competition_events.build(competition_event: competition_event)
    end
  end
end
