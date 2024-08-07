# frozen_string_literal: true

class Competition < ApplicationRecord
  include MicroserviceRegistrationHolder

  self.table_name = "Competitions"

  # We need this default order, tests rely on it.
  has_many :competition_events, -> { order(:event_id) }, dependent: :destroy
  has_many :events, through: :competition_events
  has_many :rounds, through: :competition_events
  has_many :registrations, dependent: :destroy
  has_many :results, foreign_key: "competitionId"
  has_many :scrambles, -> { order(:groupId, :isExtra, :scrambleNum) }, foreign_key: "competitionId"
  has_many :uploaded_jsons, dependent: :destroy
  has_many :competitors, -> { distinct }, through: :results, source: :person
  has_many :competitor_users, -> { distinct }, through: :competitors, source: :user
  has_many :competition_delegates, dependent: :delete_all
  has_many :delegates, -> { includes(:delegate_roles, :delegate_role_metadata) }, through: :competition_delegates
  has_many :competition_organizers, dependent: :delete_all
  has_many :organizers, through: :competition_organizers
  has_many :media, class_name: "CompetitionMedium", foreign_key: "competitionId", dependent: :delete_all
  has_many :tabs, -> { order(:display_order) }, dependent: :delete_all, class_name: "CompetitionTab"
  has_one :delegate_report, dependent: :destroy
  has_many :competition_venues, dependent: :destroy
  belongs_to :country, foreign_key: :countryId
  has_one :continent, foreign_key: :continentId, through: :country
  has_many :championships, dependent: :delete_all
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :bookmarked_competitions, dependent: :delete_all
  has_many :bookmarked_users, through: :bookmarked_competitions, source: :user
  belongs_to :competition_series, optional: true
  has_many :series_competitions, -> { readonly }, through: :competition_series, source: :competitions
  belongs_to :posting_user, optional: true, foreign_key: 'posting_by', class_name: "User"
  has_many :inbox_results, foreign_key: "competitionId", dependent: :delete_all
  has_many :inbox_persons, foreign_key: "competitionId", dependent: :delete_all
  belongs_to :announced_by_user, optional: true, foreign_key: "announced_by", class_name: "User"
  belongs_to :cancelled_by_user, optional: true, foreign_key: "cancelled_by", class_name: "User"
  has_many :competition_payment_integrations

  accepts_nested_attributes_for :competition_events, allow_destroy: true
  accepts_nested_attributes_for :championships, allow_destroy: true
  accepts_nested_attributes_for :competition_series, allow_destroy: false

  validates_numericality_of :base_entry_fee_lowest_denomination, greater_than_or_equal_to: 0, if: :entry_fee_required?
  monetize :base_entry_fee_lowest_denomination,
           as: "base_entry_fee",
           allow_nil: true,
           with_model_currency: :currency_code

  scope :not_cancelled, -> { where(cancelled_at: nil) }
  scope :visible, -> { where(showAtAll: true) }
  scope :not_visible, -> { where(showAtAll: false) }
  scope :over, -> { where("results_posted_at IS NOT NULL OR end_date < ?", Date.today) }
  scope :not_over, -> { where("results_posted_at IS NULL AND end_date >= ?", Date.today) }
  scope :end_date_passed_since, lambda { |num_days| where(end_date: ...(num_days.days.ago)) }
  scope :belongs_to_region, lambda { |region_id|
    joins(:country).where(
      "countryId = :region_id OR Countries.continentId = :region_id", region_id: region_id
    )
  }
  scope :contains, lambda { |search_term|
    where(
      "Competitions.name like :search_term or
      Competitions.cityName like :search_term",
      search_term: "%#{search_term}%",
    )
  }
  scope :has_event, lambda { |event_id|
    joins(
      "join competition_events ce#{event_id} ON ce#{event_id}.competition_id = Competitions.id
      join Events e#{event_id} ON e#{event_id}.id = ce#{event_id}.event_id",
    ).where("e#{event_id}.id = :event_id", event_id: event_id)
  }
  scope :managed_by, lambda { |user_id|
    joins("LEFT JOIN competition_organizers ON competition_organizers.competition_id = Competitions.id")
      .joins("LEFT JOIN competition_delegates ON competition_delegates.competition_id = Competitions.id")
      .where(
        "delegate_id = :user_id OR organizer_id = :user_id",
        user_id: user_id,
      ).group(:id)
  }
  scope :order_by_date, -> { order(:start_date, :end_date) }
  scope :order_by_announcement_date, -> { where.not(announced_at: nil).order(announced_at: :desc) }
  scope :confirmed, -> { where.not(confirmed_at: nil) }
  scope :not_confirmed, -> { where(confirmed_at: nil) }
  scope :pending_posting, -> { where.not(results_submitted_at: nil).where(results_posted_at: nil) }
  scope :pending_report_or_results_posting, -> { includes(:delegate_report).where(delegate_report: { posted_at: nil }).or(where(results_posted_at: nil)) }

  enum guest_entry_status: {
    unclear: 0,
    free: 1,
    restricted: 2,
  }, _prefix: true

  CLONEABLE_ATTRIBUTES = %w(
    cityName
    countryId
    information
    venue
    venueAddress
    venueDetails
    generate_website
    external_website
    latitude
    longitude
    contact
    remarks
    use_wca_registration
    use_wca_live_for_scoretaking
    competitor_limit_enabled
    competitor_limit
    competitor_limit_reason
    forbid_newcomers
    forbid_newcomers_reason
    guests_enabled
    guests_per_registration_limit
    base_entry_fee_lowest_denomination
    currency_code
    enable_donations
    extra_registration_requirements
    on_the_spot_registration
    on_the_spot_entry_fee_lowest_denomination
    allow_registration_edits
    allow_registration_self_delete_after_acceptance
    allow_registration_without_qualification
    refund_policy_percent
    guests_entry_fee_lowest_denomination
    guest_entry_status
  ).freeze
  UNCLONEABLE_ATTRIBUTES = %w(
    id
    start_date
    end_date
    name
    name_reason
    cellName
    showAtAll
    external_registration_page
    confirmed_at
    registration_open
    registration_close
    results_posted_at
    results_submitted_at
    results_nag_sent_at
    registration_reminder_sent_at
    announced_at
    cancelled_at
    created_at
    updated_at
    connected_stripe_account_id
    refund_policy_limit_date
    early_puzzle_submission
    early_puzzle_submission_reason
    qualification_results
    qualification_results_reason
    event_restrictions
    event_restrictions_reason
    force_comment_in_registration
    events_per_registration_limit
    announced_by
    cancelled_by
    results_posted_by
    posting_by
    main_event_id
    waiting_list_deadline_date
    event_change_deadline_date
    competition_series_id
    uses_v2_registrations
  ).freeze
  VALID_NAME_RE = /\A([-&.:' [:alnum:]]+) (\d{4})\z/
  VALID_ID_RE = /\A[a-zA-Z0-9]+\Z/
  PATTERN_LINK_RE = /\[\{([^}]+)}\{((https?:|mailto:)[^}]+)}\]/
  PATTERN_TEXT_WITH_LINKS_RE = /\A[^{}]*(#{PATTERN_LINK_RE.source}[^{}]*)*\z/
  URL_RE = %r{\Ahttps?://.*\z}
  MAX_ID_LENGTH = 32
  MAX_NAME_LENGTH = 50
  MAX_CELL_NAME_LENGTH = 32
  MAX_CITY_NAME_LENGTH = 50
  MAX_VENUE_LENGTH = 240
  MAX_FREETEXT_LENGTH = 191
  MAX_URL_LENGTH = 200
  MAX_MARKDOWN_LENGTH = 255
  MAX_COMPETITOR_LIMIT = 5000
  MAX_GUEST_LIMIT = 100
  validates_inclusion_of :competitor_limit_enabled, in: [true, false], if: :competitor_limit_required?
  validates_numericality_of :competitor_limit, greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_COMPETITOR_LIMIT, if: :competitor_limit_enabled?
  validates :competitor_limit_reason, presence: true, if: :competitor_limit_enabled?
  validates :guests_enabled, acceptance: { accept: true, message: I18n.t('competitions.errors.must_ask_about_guests_if_specifying_limit') }, if: :guests_per_registration_limit_enabled?
  validates_numericality_of :guests_per_registration_limit, only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_GUEST_LIMIT, allow_blank: true, if: :some_guests_allowed?
  validates_numericality_of :events_per_registration_limit, only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: :number_of_events, allow_blank: true, if: :event_restrictions?
  validates :id, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: MAX_ID_LENGTH },
                 format: { with: VALID_ID_RE }, if: :name_valid_or_updating?
  private def name_valid_or_updating?
    self.persisted? || (name.length <= MAX_NAME_LENGTH && name =~ VALID_NAME_RE)
  end
  validates :name, length: { maximum: MAX_NAME_LENGTH },
                   format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }
  validates :cellName, length: { maximum: MAX_CELL_NAME_LENGTH },
                       format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }, if: :name_valid_or_updating?
  validates :venue, format: { with: PATTERN_TEXT_WITH_LINKS_RE }
  validates :external_website, format: { with: URL_RE }, allow_blank: true
  validates :external_registration_page, presence: true, format: { with: URL_RE }, if: :external_registration_page_required?

  validates_inclusion_of :countryId, in: Country::ALL_COUNTRY_IDS
  validates :currency_code, inclusion: { in: Money::Currency, message: proc { I18n.t('competitions.errors.invalid_currency_code') } }

  validates_numericality_of :refund_policy_percent, greater_than_or_equal_to: 0, less_than_or_equal_to: 100, if: :refund_policy_percent_required?
  validates :refund_policy_limit_date, presence: true, if: :refund_policy_percent?
  validates_inclusion_of :on_the_spot_registration, in: [true, false], if: :on_the_spot_registration_required?
  validates_numericality_of :on_the_spot_entry_fee_lowest_denomination, greater_than_or_equal_to: 0, if: :on_the_spot_entry_fee_required?
  validates_inclusion_of :allow_registration_edits, in: [true, false]
  validates_inclusion_of :allow_registration_self_delete_after_acceptance, in: [true, false]
  monetize :on_the_spot_entry_fee_lowest_denomination,
           as: "on_the_spot_base_entry_fee",
           allow_nil: true,
           with_model_currency: :currency_code
  validates_numericality_of :guests_entry_fee_lowest_denomination, greater_than_or_equal_to: 0, if: :guests_entry_fee_required?
  monetize :guests_entry_fee_lowest_denomination,
           as: "guests_base_fee",
           allow_nil: true,
           with_model_currency: :currency_code
  validates :forbid_newcomers_reason, presence: true, if: :forbid_newcomers?
  validates :early_puzzle_submission_reason, presence: true, if: :early_puzzle_submission?
  # cannot validate `qualification_results IN [true, false]` because we historically have competitions
  # where we legitimately don't know whether or not they used qualification times so we have to set them to NULL.
  validates :qualification_results_reason, presence: true, if: :persisted_uses_qualification?
  validates :event_restrictions_reason, presence: true, if: :event_restrictions?
  validates_inclusion_of :main_event_id, in: ->(comp) { [nil].concat(comp.persisted_events_id) }

  # Validations are used to show form errors to the user. If string columns aren't validated for length, it produces an unexplained error for the user
  validates :name, length: { maximum: MAX_NAME_LENGTH }
  validates :cellName, length: { maximum: MAX_CELL_NAME_LENGTH }
  validates :cityName, length: { maximum: MAX_CITY_NAME_LENGTH }
  validates :venue, length: { maximum: MAX_VENUE_LENGTH }
  validates :venueAddress, :venueDetails, :name_reason, :forbid_newcomers_reason, length: { maximum: MAX_FREETEXT_LENGTH }
  validates :external_website, :external_registration_page, length: { maximum: MAX_URL_LENGTH }
  validates :contact, length: { maximum: MAX_MARKDOWN_LENGTH }

  # Dirty old trick to deal with competition id changes (see other methods using
  # 'with_old_id' for more details).
  def persisted_events_id
    with_old_id do
      self.competition_events.map(&:event_id)
    end
  end

  def persisted_uses_qualification?
    with_old_id do
      self.uses_qualification?
    end
  end

  def guests_per_registration_limit_enabled?
    some_guests_allowed? && !guests_per_registration_limit.nil?
  end

  def events_per_registration_limit_enabled?
    event_restrictions? && events_per_registration_limit.present?
  end

  def number_of_events
    persisted_events_id.length
  end

  def has_administrative_notes?
    registrations.any? { |registration| !registration.administrative_notes.blank? }
  end

  NEARBY_DISTANCE_KM_WARNING = 250
  NEARBY_DISTANCE_KM_DANGER = 10
  NEARBY_DISTANCE_KM_INFO = 100
  NEARBY_DAYS_WARNING = 180
  NEARBY_DAYS_DANGER = 5
  NEARBY_DAYS_INFO = 365
  NEARBY_INFO_COUNT = 8
  REGISTRATION_COLLISION_MINUTES_WARNING = 180
  REGISTRATION_COLLISION_MINUTES_DANGER = 30
  RECENT_DAYS = 30
  REPORT_AND_RESULTS_DAYS_OK = 7
  REPORT_AND_RESULTS_DAYS_WARNING = 14
  REPORT_AND_RESULTS_DAYS_DANGER = 21
  ANNOUNCED_DAYS_WARNING = 21
  ANNOUNCED_DAYS_DANGER = 28
  MAX_SPAN_DAYS = 6

  # 1. on https://documents.worldcubeassociation.org/documents/policies/external/Competition%20Requirements.pdf
  MUST_BE_ANNOUNCED_GTE_THIS_MANY_DAYS = 28

  # Time in seconds from 6.2.1 in https://documents.worldcubeassociation.org/documents/policies/external/Competition%20Requirements.pdf
  # 48 hours
  REGISTRATION_OPENING_EARLIEST = 172_800

  validates :cityName, city: true

  # We have stricter validations for confirming a competition
  validates :cityName, :countryId, :venue, :venueAddress, :latitude, :longitude, presence: true, if: :confirmed_or_visible?
  validates :name_reason, presence: true, if: :name_reason_required?
  validates :external_website, presence: true, if: -> { confirmed_or_visible? && !generate_website }

  validates :registration_open, :registration_close, presence: { message: I18n.t('simple_form.required.text') }, if: :registration_period_required?

  # NOTE: we only validate when confirming, until we have a unified events/rounds editor.
  # If we would validate everytime, changing the number of rounds for
  # competition wouldn't be possible: adding rounds through the events page
  # couldn't be possible because the schedule doesn't contain the round
  # just added.
  validate :must_have_at_least_one_event, if: :confirmed_or_visible?
  private def must_have_at_least_one_event
    if no_events?
      errors.add(:competition_events, I18n.t('competitions.errors.must_contain_event'))
    end
  end

  # Only validate on update: nobody can confirm competition on creation.
  # The only exception to this is within tests, in which case we actually don't want to run this validation.
  validate :schedule_must_match_rounds, if: :confirmed_at_changed?, on: :update
  # Competitions after 2018-12-31 will have this check. All comps from 2019 onwards required a schedule.
  # Check added per "Support for cancelled competitions" and adding some old cancelled competitions to the website without a schedule.
  def schedule_must_match_rounds
    if start_date.present? && start_date > Date.new(2018, 12, 31)
      unless has_any_round_per_event? && schedule_includes_rounds?
        errors.add(:competition_events, I18n.t('competitions.errors.schedule_must_match_rounds'))
      end
    end
  end

  validate :advancement_condition_must_be_present_for_all_non_final_rounds, if: :confirmed_at_changed?, on: :update
  def advancement_condition_must_be_present_for_all_non_final_rounds
    unless rounds.all?(&:advancement_condition_is_valid?)
      errors.add(:competition_events, I18n.t('competitions.errors.advancement_condition_must_be_present_for_all_non_final_rounds'))
    end
  end

  attr_accessor :closing_full_registration
  private def should_validate_registration_closing?
    confirmed_or_visible? && (will_save_change_to_registration_close? || will_save_change_to_confirmed_at?) && !closing_full_registration
  end

  # Same comment as for start_date_must_be_28_days_in_advance
  validate :registation_must_not_be_past, if: :should_validate_registration_closing?
  private def registation_must_not_be_past
    if editing_user_id
      editing_user = User.find(editing_user_id)
      if !editing_user.can_admin_competitions? && registration_range_specified? && registration_past?
        errors.add(:registration_close, I18n.t('competitions.errors.registration_already_closed'))
      end
    end
  end

  def has_any_round_per_event?
    competition_events.map(&:rounds).none?(&:empty?)
  end

  def schedule_includes_rounds?
    # We use activities instead of simply rounds, because for 333mbf and 333fm
    # we want to check all attempts are scheduled!
    expected_activity_codes = rounds.flat_map do |r|
      # Logic similar to "ActivitiesForRound"
      # from app/javascript/edit-schedule/SchedulesEditor/ActivityPicker.jsx
      if ["333mbf", "333fm"].include?(r.event.id)
        (1..r.format.expected_solve_count).map do |i|
          "#{r.wcif_id}-a#{i}"
        end
      else
        r.wcif_id
      end
    end
    declared_activity_codes = competition_venues.map do |venue|
      venue.venue_rooms.map do |room|
        room.schedule_activities.map(&:all_activity_codes)
      end
    end.flatten
    (expected_activity_codes - declared_activity_codes).empty?
  end

  def number_of_days
    (end_date - start_date).to_i + 1
  end

  def start_time
    # Take the easternmost offset
    start_date.to_time.change(offset: "+14:00")
  end

  def end_time
    # Take the westernmost offset
    (end_date + 1).to_time.change(offset: "-12:00")
  end

  def main_event
    Event.c_find(main_event_id)
  end

  def with_old_id
    new_id = self.id
    self.id = id_was
    yield
  ensure
    self.id = new_id
  end

  def no_events?
    with_old_id do
      competition_events.reject(&:marked_for_destruction?).empty?
    end
  end

  validate :must_have_at_least_one_delegate, if: :confirmed_or_visible?
  def must_have_at_least_one_delegate
    if staff_delegate_ids.empty?
      errors.add(:staff_delegate_ids, I18n.t('competitions.errors.must_contain_delegate'))
    end
  end

  def confirmed_or_visible?
    self.confirmed? || self.showAtAll
  end

  def registration_full?
    competitor_count = uses_new_registration_service? ? Microservices::Registrations.competitor_count_by_competition(id) : registrations.accepted_and_paid_pending_count
    competitor_limit_enabled? && competitor_count >= competitor_limit
  end

  def number_of_bookmarks
    bookmarked_users.count
  end

  def country
    Country.c_find(self.countryId)
  end

  def continent
    country.continent
  end

  def main_event_id=(event_id)
    super(event_id.blank? ? nil : event_id)
  end

  # Enforce that the users marked as delegates for this competition are
  # actually delegates. Note: just because someone (legally) delegated a
  # competition in the past does not mean that they are still a delegate,
  # so we do not enforce this validation for past competitions.
  # See https://github.com/thewca/worldcubeassociation.org/issues/185#issuecomment-168402252
  # for a discussion about tracking delegate history so we could tighten up
  # this validation.
  validate :delegates_must_be_delegates, unless: :is_probably_over?
  def delegates_must_be_delegates
    unless self.delegates.all?(&:any_kind_of_delegate?)
      errors.add(:staff_delegate_ids, I18n.t('competitions.errors.not_all_delegates'))
      errors.add(:trainee_delegate_ids, I18n.t('competitions.errors.not_all_delegates'))
    end
  end

  def user_should_post_delegate_report?(user)
    persisted? && is_probably_over? && !cancelled? && !delegate_report.posted? && delegates.include?(user)
  end

  def user_should_post_competition_results?(user)
    persisted? && is_probably_over? && !cancelled? && !self.results_submitted? && delegates.include?(user)
  end

  def warnings_for(user)
    warnings = {}
    if self.showAtAll
      unless self.announced?
        warnings[:announcement] = I18n.t('competitions.messages.not_announced')
      end

      if self.results.any? && !self.results_posted?
        if user&.can_admin_results?
          warnings[:results] = I18n.t('competitions.messages.results_not_posted')
        else
          warnings[:results] = I18n.t('competitions.messages.results_still_processing')
        end
      end

      if self.registration_full? && self.registration_currently_open?
        warnings[:waiting_list] = registration_full_message
      end

    else
      warnings[:invisible] = I18n.t('competitions.messages.not_visible')

      if self.name.length > 32
        warnings[:name] = I18n.t('competitions.messages.name_too_long')
      end

      unless /^[[:upper:]]|^\d/.match(self.id)
        warnings[:id] = I18n.t('competitions.messages.id_starts_with_lowercase')
      end

      if no_events?
        warnings[:events] = I18n.t('competitions.messages.must_have_events')
      end

      if !self.waiting_list_deadline_date
        warnings[:waiting_list_deadline_missing] = I18n.t('competitions.messages.no_waiting_list_specified')
      end

      # NOTE: this will show up on the edit schedule page, and stay even if the
      # schedule matches when saved. Should we add some logic to not show this
      # message on the edit schedule page?
      unless has_any_round_per_event? && schedule_includes_rounds?
        warnings[:schedule] = I18n.t('competitions.messages.schedule_must_match_rounds')
      end

      unless rounds.all?(&:advancement_condition_is_valid?)
        warnings[:advancement_conditions] = I18n.t('competitions.messages.advancement_condition_must_be_present_for_all_non_final_rounds')
      end

      rounds.select(&:cutoff_is_greater_than_time_limit?).each do |round|
        warnings['cutoff_is_greater_than_time_limit' + round.id.to_s] = I18n.t('competitions.messages.cutoff_is_greater_than_time_limit', round_number: round.number, event: I18n.t('events.' + round.event.id))
      end

      rounds.select(&:cutoff_is_too_fast?).each do |round|
        warnings['cutoff_is_too_fast' + round.id.to_s] = I18n.t('competitions.messages.cutoff_is_too_fast', round_number: round.number, event: I18n.t('events.' + round.event.id))
      end

      rounds.select(&:cutoff_is_too_slow?).each do |round|
        warnings['cutoff_is_too_slow' + round.id.to_s] = I18n.t('competitions.messages.cutoff_is_too_slow', round_number: round.number, event: I18n.t('events.' + round.event.id))
      end

      rounds.select(&:time_limit_is_too_fast?).each do |round|
        warnings['time_limit_is_too_fast' + round.id.to_s] = I18n.t('competitions.messages.time_limit_is_too_fast', round_number: round.number, event: I18n.t('events.' + round.event.id))
      end

      rounds.select(&:time_limit_is_too_slow?).each do |round|
        warnings['time_limit_is_too_slow' + round.id.to_s] = I18n.t('competitions.messages.time_limit_is_too_slow', round_number: round.number, event: I18n.t('events.' + round.event.id))
      end

      if championship_warnings.any?
        warnings = championship_warnings.merge(warnings)
      end

      if has_fees? && !competition_payment_integrations.exists?
        warnings[:registration_payment_info] = I18n.t('competitions.messages.registration_payment_info')
      end
    end

    if reg_warnings.any? && user&.can_manage_competition?(self)
      warnings = reg_warnings.merge(warnings)
    end

    warnings
  end

  def registration_full_message
    if registration_full? && registrations.accepted.count >= competitor_limit
      I18n.t('registrations.registration_full', competitor_limit: competitor_limit)
    else
      I18n.t('registrations.registration_full_include_waiting_list', competitor_limit: competitor_limit)
    end
  end

  def reg_warnings
    warnings = {}
    if registration_range_specified? && !registration_past?
      if self.announced?
        if (self.registration_open - self.announced_at) < REGISTRATION_OPENING_EARLIEST
          warnings[:regearly] = I18n.t('competitions.messages.reg_opens_too_early')
        end
      else
        if (self.registration_open - Time.now.utc) < REGISTRATION_OPENING_EARLIEST
          warnings[:regearly] = I18n.t('competitions.messages.reg_opens_too_early')
        end
      end
    end
    if registration_range_specified? && registration_past?
      unless self.announced?
        warnings[:regclosed] = I18n.t('competitions.messages.registration_already_closed')
      end
    end

    warnings
  end

  def championship_warnings
    warnings = {}
    self.championships.each do |championship|
      if Championship.joins(:competition).merge(Competition.visible).exists?(championship_type: championship.championship_type, competition_id: Competition.where('YEAR(start_date) = ?', self.start_date.year))
        warnings[championship.championship_type] = I18n.t('competitions.messages.championship_exists', championship_type: championship.name, year: self.start_date.year)
      end
    end

    warnings
  end

  def info_for(user)
    info = {}
    if !self.results_posted? && self.is_probably_over? && !self.cancelled?
      info[:upload_results] = I18n.t('competitions.messages.upload_results')
    end
    if self.in_progress? && !self.cancelled?
      if self.use_wca_live_for_scoretaking
        info[:in_progress] = I18n.t('competitions.messages.in_progress_at_wca_live_html', link_here: self.wca_live_link).html_safe
      else
        info[:in_progress] = I18n.t('competitions.messages.in_progress', date: I18n.l(self.end_date, format: :long))
      end
    end
    info
  end

  def user_can_pre_register?(user)
    delegates.include?(user) || trainee_delegates.include?(user) || organizers.include?(user)
  end

  attr_accessor :being_cloned_from_id
  def being_cloned_from
    Competition.find_by(id: being_cloned_from_id)
  end

  def build_clone
    Competition.new(attributes.slice(*CLONEABLE_ATTRIBUTES)).tap do |clone|
      clone.being_cloned_from_id = id

      Competition.reflections.each_key do |association_name|
        case association_name
        when 'registrations',
             'results',
             'competitors',
             'competitor_users',
             'delegate_report',
             'competition_delegates',
             'competition_events',
             'competition_organizers',
             'competition_venues',
             'media',
             'scrambles',
             'country',
             'continent',
             'championships',
             'rounds',
             'uploaded_jsons',
             'wcif_extensions',
             'bookmarked_competitions',
             'bookmarked_users',
             'competition_series',
             'series_competitions',
             'posting_user',
             'inbox_results',
             'inbox_persons',
             'announced_by_user',
             'cancelled_by_user',
             'competition_payment_integrations',
             'microservice_registrations'
          # Do nothing as they shouldn't be cloned.
        when 'organizers'
          clone.organizers = organizers
        when 'delegates'
          clone.delegates = delegates
        when 'events'
          clone.events = events
        when 'tabs'
          # Clone tabs in the clone_associations callback after the competition is saved.
          clone.clone_tabs = true
        else
          raise "Cloning behavior for Competition.#{association_name} is not defined. See Competition#build_clone."
        end
      end
    end
  end

  attr_accessor :clone_tabs

  # After the cloned competition is created, clone other associations which cannot just be copied.
  after_create :clone_associations
  private def clone_associations
    # Clone competition tabs.
    if clone_tabs
      being_cloned_from&.tabs&.each do |tab|
        tabs.create(tab.attributes.slice(*CompetitionTab::CLONEABLE_ATTRIBUTES))
      end
    end
  end

  after_create :create_delegate_report!

  validate :dates_must_be_valid

  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude
  before_validation :compute_coordinates

  before_validation :create_id_and_cell_name
  def create_id_and_cell_name(force_override: false)
    m = VALID_NAME_RE.match(name)
    if m
      name_without_year = m[1]
      year = m[2]
      if id.blank? || force_override
        # Generate competition id from name
        # By replacing accented chars with their ascii equivalents, and then
        # removing everything that isn't a digit or a character.
        safe_name_without_year = ActiveSupport::Inflector.transliterate(name_without_year, locale: :en).gsub(/[^a-z0-9]+/i, '')
        self.id = safe_name_without_year[0...(MAX_ID_LENGTH - year.length)] + year
      end
      if cellName.blank? || force_override
        year = " " + year
        self.cellName = name_without_year.truncate(MAX_CELL_NAME_LENGTH - year.length) + year
      end
    end
  end

  attr_writer :staff_delegate_ids, :organizer_ids, :trainee_delegate_ids
  def staff_delegate_ids
    @staff_delegate_ids || staff_delegates.pluck(:id).join(",")
  end

  def organizer_ids
    @organizer_ids || organizers.pluck(:id).join(",")
  end

  def trainee_delegate_ids
    @trainee_delegate_ids || trainee_delegates.pluck(:id).join(",")
  end

  def enable_v2_registrations!
    update_column :uses_v2_registrations, true
  end

  def uses_new_registration_service?
    self.uses_v2_registrations
  end

  def should_render_register_v2?(user)
    uses_new_registration_service? && user.cannot_register_for_competition_reasons(self).empty? && (registration_currently_open? || user_can_pre_register?(user))
  end

  before_validation :unpack_delegate_organizer_ids
  def unpack_delegate_organizer_ids
    # This is a mess. When changing competition ids, the calls to delegates=
    # and organizers= below will cause database writes with a new competition_id.
    # We hack around this by pretending our id actually didn't change, and then
    # we restore it at the end. This means we'll preseve our existing
    # CompetitionOrganizer and CompetitionDelegate rows rather than creating new ones.
    # We'll fix their competition_id below in update_foreign_keys.
    with_old_id do
      if @staff_delegate_ids || @trainee_delegate_ids
        self.delegates ||= []

        if @staff_delegate_ids
          unpacked_staff_delegates = @staff_delegate_ids.split(",").map { |id| User.find(id) }

          # we overwrite staff_delegates, which means that we _keep_ existing trainee_delegates.
          self.delegates = self.trainee_delegates | unpacked_staff_delegates
        end
        if @trainee_delegate_ids
          unpacked_trainee_delegates = @trainee_delegate_ids.split(",").map { |id| User.find(id) }

          # we overwrite trainee_delegates, which means that we _keep_ existing staff_delegates.
          self.delegates = self.staff_delegates | unpacked_trainee_delegates
        end
      end
      if @organizer_ids
        self.organizers = @organizer_ids.split(",").map { |id| User.find(id) }
      end
    end
  end

  def staff_delegates
    # If we filter `delegates` using the `staff_delegate?` method, we lose information
    # about historical associations (which we unfortunately do not store in our DB yet).
    # So we treat all non-trainees as Delegates, to ensure that even demoted/retired Delegates stay listed.
    delegates - trainee_delegates
  end

  def trainee_delegates
    delegates.select(&:trainee_delegate?)
  end

  def has_defined_dates?
    self.start_date.present? && self.end_date.present?
  end

  old_competition_events_attributes = instance_method(:competition_events_attributes=)
  define_method(:competition_events_attributes=) do |attributes|
    # This is also a mess. We "overload" the competition_events_attributes= method
    # so it won't be confused by the fact that our competition's id is changing.
    # See similar hack and comment in unpack_delegate_organizer_ids.
    with_old_id do
      old_competition_events_attributes.bind(self).call(attributes)
    end
  end

  # Workaround for PHP code that requires these tables to be clean.
  # Once we're in all railsland, this can go, and we can add a script
  # that checks our database sanity instead.
  after_save :remove_non_existent_organizers_and_delegates
  def remove_non_existent_organizers_and_delegates
    CompetitionOrganizer.where(competition_id: id).where.not(organizer_id: organizers.map(&:id)).delete_all
    CompetitionDelegate.where(competition_id: id).where.not(delegate_id: delegates.map(&:id)).delete_all
  end

  # We setup an alias here to be able to take advantage of `includes(:delegate_report)` on a competition,
  # while still being able to use the 'with_old_id' trick.
  alias_method :original_delegate_report, :delegate_report
  def delegate_report
    with_old_id do
      original_delegate_report
    end
  end

  def report_posted_at
    delegate_report&.posted_at
  end

  # This callback updates all tables having the competition id, when the id changes.
  # This should be deleted after competition id is made immutable: https://github.com/thewca/worldcubeassociation.org/pull/381
  after_save :update_foreign_keys, if: :saved_change_to_id?
  def update_foreign_keys
    Competition.reflect_on_all_associations.uniq(&:klass).each do |association_reflection|
      foreign_key = association_reflection.foreign_key
      if ["competition_id", "competitionId"].include?(foreign_key)
        association_reflection.klass.where(foreign_key => id_before_last_save).update_all(foreign_key => id)
      end
    end
  end

  def any_date_has_changed?
    saved_change_to_start_date? || saved_change_to_end_date?
  end

  after_save :move_schedule, if: :any_date_has_changed?
  def move_schedule
    old_end_date = saved_changes["end_date"]&.first || end_date
    old_start_date = saved_changes["start_date"]&.first || start_date
    old_number_of_days = (old_end_date - old_start_date).to_i + 1

    competition_activities = top_level_activities
    if start_date && end_date
      # NOTE: when doing the change we don't need to care about the timezone, as we just "move" all the datetime the same way
      if number_of_days >= old_number_of_days
        competition_activities.each do |a|
          a.move_by((start_date - old_start_date).to_i.days)
        end
      else
        # NOTE: this is an arbitrary chosen policy when shrinking competition dates.
        # move all activities on start_date to new "start_date"
        # move all activities on days between ]start_date, end_date] to new "end_date"
        to_start, to_end = competition_activities.partition { |a| a.start_time.to_date == old_start_date }
        to_end.each { |a| a.move_to(end_date) }
        to_start.each { |a| a.move_to(start_date) }
      end
    elsif start_date || end_date
      competition_activities.each { |a| a.move_to(start_date || end_date) }
    else
      competition_activities.each(&:destroy)
    end
  end

  attr_accessor :editing_user_id
  validate :user_cannot_demote_themself
  def user_cannot_demote_themself
    if editing_user_id
      editing_user = User.find(editing_user_id)
      unless editing_user.can_manage_competition?(self)
        errors.add(:staff_delegate_ids, "You cannot demote yourself")
        errors.add(:trainee_delegate_ids, "You cannot demote yourself")
        errors.add(:organizer_ids, "You cannot demote yourself")
      end
    end
  end

  validate :organizers_can_organize_competition
  private def organizers_can_organize_competition
    organizers.each do |organizer|
      if organizer&.cannot_organize_competition_reasons.present?
        errors.add(:organizer_ids, "#{organizer.name}: #{organizer.cannot_organize_competition_reasons.to_sentence}")
      end
    end
  end

  validate :registration_must_close_after_it_opens
  def registration_must_close_after_it_opens
    if registration_open && registration_close && !(registration_open < registration_close)
      errors.add(:registration_close, I18n.t('competitions.errors.registration_close_after_open'))
    end
  end

  attr_reader :receive_registration_emails
  def receive_registration_emails=(r)
    @receive_registration_emails = ActiveRecord::Type::Boolean.new.cast(r)
  end

  after_save :clear_external_website, if: :generate_website?
  private def clear_external_website
    update_column :external_website, nil
  end

  def website
    generate_website ? internal_website : external_website
  end

  def internal_website
    Rails.application.routes.url_helpers.competition_url(self, host: EnvConfig.ROOT_URL)
  end

  def managers
    (organizers + delegates).uniq
  end

  def receiving_registration_emails?(user_id)
    competition_delegate = competition_delegates.find_by_delegate_id(user_id)
    if competition_delegate&.receive_registration_emails
      return true
    end
    competition_organizer = competition_organizers.find_by_organizer_id(user_id)
    if competition_organizer&.receive_registration_emails
      return true
    end

    false
  end

  def can_receive_registration_emails?(user_id)
    competition_delegate = competition_delegates.find_by_delegate_id(user_id)
    if competition_delegate
      return true
    end
    competition_organizer = competition_organizers.find_by_organizer_id(user_id)
    if competition_organizer
      return true
    end

    false
  end

  # We only do this after_update, because upon adding/removing a manager to a
  # competition the attribute is automatically set to that manager's preference.
  after_update :update_receive_registration_emails
  def update_receive_registration_emails
    if editing_user_id && !@receive_registration_emails.nil?
      competition_delegate = competition_delegates.find_by_delegate_id(editing_user_id)
      if competition_delegate
        competition_delegate.update_attribute(:receive_registration_emails, @receive_registration_emails)
      end
      competition_organizer = competition_organizers.find_by_organizer_id(editing_user_id)
      if competition_organizer
        competition_organizer.update_attribute(:receive_registration_emails, @receive_registration_emails)
      end
    end
  end

  def using_payment_integrations?
    competition_payment_integrations.exists? && has_fees?
  end

  def can_edit_registration_fees?
    # Quick workaround for https://github.com/thewca/worldcubeassociation.org/issues/2123
    # (We used to return `registrations.with_payments.empty?` here)
    true
  end

  def registration_currently_open?
    use_wca_registration? && !cancelled? && !registration_not_yet_opened? && !registration_past?
  end

  def registration_not_yet_opened?
    registration_open && Time.now < registration_open
  end

  def registration_past?
    registration_close && registration_close < Time.now
  end

  def registration_status
    if registration_not_yet_opened?
      :not_yet_opened
    elsif registration_past?
      :past
    elsif registration_full?
      :full
    else
      :open
    end
  end

  def any_registrations?
    if uses_new_registration_service?
      self.microservice_registrations.any?
    else
      self.registrations.any?
    end
  end

  def registration_range_specified?
    registration_open.present? && registration_close.present?
  end

  def longitude_degrees
    longitude_microdegrees ? longitude_microdegrees / 1e6 : nil
  end

  def longitude_degrees=(new_longitude_degrees)
    @longitude_degrees = new_longitude_degrees.to_f
  end

  def longitude_radians
    to_radians longitude_degrees
  end

  def latitude_degrees
    latitude_microdegrees ? latitude_microdegrees / 1e6 : nil
  end

  def latitude_degrees=(new_latitude_degrees)
    @latitude_degrees = new_latitude_degrees.to_f
  end

  def latitude_radians
    to_radians latitude_degrees
  end

  def country_zones
    ActiveSupport::TimeZone.country_zones(country.iso2).to_h { |tz| [tz.name, tz.tzinfo.name] }
  rescue TZInfo::InvalidCountryCode
    # This can occur for non real country *and* XK!
    # FIXME what to provide for XA, XE, XM, XS?
    {
      "London" => "Europe/London",
    }
  end

  private def compute_coordinates
    unless @latitude_degrees.nil?
      self.latitude_microdegrees = @latitude_degrees * 1e6
    end
    unless @longitude_degrees.nil?
      self.longitude_microdegrees = @longitude_degrees * 1e6
    end
  end

  def has_events_with_ids?(event_ids)
    (event_ids - events.ids).empty?
  end

  def has_event?(event)
    self.events.include?(event)
  end

  def has_base_entry_fee?
    base_entry_fee.nonzero?
  end

  def has_fees?
    if base_entry_fee_lowest_denomination.nil?
      competition_events.sum(:fee_lowest_denomination) > 0
    else
      base_entry_fee_lowest_denomination + competition_events.sum(:fee_lowest_denomination) > 0
    end
  end

  def external_registration_page_required?
    confirmed? && !use_wca_registration && created_at.present? && created_at > Date.new(2018, 12, 31)
  end

  def has_rounds?
    rounds.any?
  end

  def has_schedule?
    competition_venues.any?
  end

  def entry_fee_required?
    (
      confirmed? && created_at.present? && created_at > Date.new(2018, 7, 17) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
    )
  end

  def competitor_limit_enabled?
    competitor_limit_enabled
  end

  def competitor_limit_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 9, 1)
  end

  def on_the_spot_registration_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22)
  end

  def on_the_spot_entry_fee_required?
    (
      on_the_spot_registration? &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
    )
  end

  def refund_policy_percent_required?
    (
      confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
    )
  end

  def guests_entry_fee_required?
    (
      confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
    )
  end

  def all_guests_allowed?
    guest_entry_status_free?
  end

  def some_guests_allowed?
    guest_entry_status_restricted?
  end

  def registration_period_required?
    use_wca_registration? || (confirmed? && created_at.present? && created_at > Date.new(2018, 9, 13))
  end

  def name_reason_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 10, 20)
  end

  def pending_results_or_report(num_days)
    self.end_date < num_days.days.ago && (self.delegate_report.posted_at.nil? || results_posted_at.nil?)
  end

  # does the competition have this field (regardless of whether it's a date or blank)
  def has_event_change_deadline_date?
    start_date.present? && start_date > Date.new(2021, 6, 24)
  end

  # can registration edits be done right now
  # must be allowed in general, and if the deadline field exists, is it a date and in the future
  def registration_edits_allowed?
    self.allow_registration_edits &&
      (!has_event_change_deadline_date? || !event_change_deadline_date.present? || event_change_deadline_date > DateTime.now)
  end

  # can competitors delete their own registration after it has been accepetd
  def registration_delete_after_acceptance_allowed?
    self.allow_registration_self_delete_after_acceptance
  end

  private def dates_must_be_valid
    if start_date.nil? && end_date.nil?
      if confirmed_or_visible?
        errors.add(:start_date, I18n.t('common.errors.invalid'))
        errors.add(:end_date, I18n.t('common.errors.invalid'))
      end
      return
    end

    return errors.add(:start_date, I18n.t('common.errors.invalid')) unless start_date.present?
    return errors.add(:end_date, I18n.t('common.errors.invalid')) unless end_date.present?

    if end_date < start_date
      errors.add(:end_date, I18n.t('competitions.errors.end_date_before_start'))
    end

    if number_of_days > MAX_SPAN_DAYS
      errors.add(:end_date, I18n.t('competitions.errors.span_too_many_days', max_days: MAX_SPAN_DAYS))
    end
  end

  validate :registration_dates_must_be_valid
  private def registration_dates_must_be_valid
    if refund_policy_limit_date? && refund_policy_limit_date > start_date
      errors.add(:refund_policy_limit_date, I18n.t('competitions.errors.refund_date_after_start'))
    end

    if registration_period_required? && registration_open.present? && registration_close.present? &&
       (registration_open >= start_date || registration_close >= start_date)
      errors.add(:registration_close, I18n.t('competitions.errors.registration_period_after_start'))
    end
  end

  validate :waiting_list_dates_must_be_valid
  private def waiting_list_dates_must_be_valid
    if waiting_list_deadline_date?
      if waiting_list_deadline_date < registration_close
        errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_before_registration_close'))
      end
      if refund_policy_limit_date? && waiting_list_deadline_date < refund_policy_limit_date
        errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_before_refund_date'))
      end
      if waiting_list_deadline_date > end_date
        errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_after_end'))
      end
    end
  end

  validate :event_change_dates_must_be_valid
  private def event_change_dates_must_be_valid
    if event_change_deadline_date?
      if event_change_deadline_date < registration_close
        errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_before_registration_close'))
      end
      if on_the_spot_registration? && event_change_deadline_date < start_date
        errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_with_ots'))
      end
      if event_change_deadline_date > end_date.to_datetime.end_of_day
        errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_after_end_date'))
      end
    end
  end

  # Since Competition.events only includes saved events
  # this method is required to ensure that in any forms which
  # select events, unsaved events are still presented if
  # there are any validation issues on the form.
  def saved_and_unsaved_events
    competition_events.reject(&:marked_for_destruction?).map(&:event)
  end

  def adjacent_competitions(days, distance)
    Competition.where("ABS(DATEDIFF(?, start_date)) <= ? AND id <> ?", start_date, days, id)
               .select { |c| kilometers_to(c) <= distance }
               .sort_by { |c| kilometers_to(c) }
  end

  def nearby_competitions_info
    adjacent_competitions(NEARBY_DAYS_INFO, NEARBY_DISTANCE_KM_INFO)
  end

  def nearby_competitions_warning
    adjacent_competitions(NEARBY_DAYS_WARNING, NEARBY_DISTANCE_KM_WARNING)
  end

  def nearby_competitions_danger
    adjacent_competitions(NEARBY_DAYS_DANGER, NEARBY_DISTANCE_KM_DANGER)
  end

  def series_eligible_competitions
    adjacent_competitions(CompetitionSeries::MAX_SERIES_DISTANCE_DAYS, CompetitionSeries::MAX_SERIES_DISTANCE_KM)
  end

  def colliding_registration_start_competitions
    Competition.where("ABS(TIMESTAMPDIFF(MINUTE, ?, registration_open)) <= ? AND id <> ?", registration_open, REGISTRATION_COLLISION_MINUTES_WARNING, id)
               .order(:registration_open)
  end

  private def to_radians(degrees)
    degrees * Math::PI / 180
  end

  # Source http://www.movable-type.co.uk/scripts/latlong.html
  def kilometers_to(c)
    6371 *
      Math.sqrt(
        (((c.longitude_radians - longitude_radians) * Math.cos((c.latitude_radians + latitude_radians)/2)) ** 2) +
        ((c.latitude_radians - latitude_radians) ** 2),
      )
  end

  def has_date?
    !start_date.nil? || !end_date.nil?
  end

  def has_registration_start_date?
    !registration_open.nil?
  end

  def has_location?
    latitude.present? && longitude.present?
  end

  # The division is to convert the end result from secods to days. .to_date removed some hours from the subtraction
  def days_until
    start_date ? ((start_date.to_time(:utc) - Time.now.utc)/(86_400)).to_i : nil
  end

  def time_until_registration
    registration_open ? ApplicationController.helpers.distance_of_time_in_words_to_now(registration_open) : nil
  end

  def date_range
    ApplicationController.helpers.wca_date_range(self.start_date, self.end_date)
  end

  def has_date_errors?
    valid?
    !errors[:start_date].empty? || !errors[:end_date].empty? || (!showAtAll && days_until && days_until < MUST_BE_ANNOUNCED_GTE_THIS_MANY_DAYS)
  end

  # The competition must be at least 28 days in advance in order to confirm it. Admins are able to modify the competition despite being less than 28 days in advance.
  # We only run this validation if we're actually changing the start_date or
  # confirming the competition, to not prevent organizers/delegates from
  # updating competition-specific setttings, such as the receive notifications checkbox.
  validate :start_date_must_be_28_days_in_advance, if: :should_validate_start_date?
  def start_date_must_be_28_days_in_advance
    if editing_user_id
      editing_user = User.find(editing_user_id)
      if !editing_user.can_admin_competitions? && start_date && days_until < MUST_BE_ANNOUNCED_GTE_THIS_MANY_DAYS
        errors.add(:start_date, I18n.t('competitions.errors.start_date_must_be_28_days_in_advance'))
      end
    end
  end

  def should_validate_start_date?
    confirmed_or_visible? && (will_save_change_to_start_date? || will_save_change_to_confirmed_at?)
  end

  def days_until_competition?(c)
    if !c.has_date? || !self.has_date?
      return false
    end
    days_until = (c.start_date - self.end_date).to_i
    if days_until < 0
      days_until = (self.start_date - c.end_date).to_i * -1
    end
    days_until
  end

  def dangerously_close_to?(c)
    self.adjacent_to?(c, NEARBY_DISTANCE_KM_DANGER, NEARBY_DAYS_DANGER)
  end

  def adjacent_to?(c, distance_km, distance_days)
    self.distance_adjacent_to?(c, distance_km) && self.start_date_adjacent_to?(c, distance_days)
  end

  def start_date_adjacent_to?(c, distance_days)
    if !c.has_date? || !self.has_date?
      return false
    end
    self.days_until_competition?(c).abs < distance_days
  end

  def distance_adjacent_to?(c, distance_km)
    self.kilometers_to(c) < distance_km
  end

  def registration_open_adjacent_to?(c, distance_minutes)
    if !c.has_registration_start_date? || !self.has_registration_start_date?
      return false
    end
    self.minutes_until_other_registration_starts(c).abs < distance_minutes
  end

  def minutes_until_other_registration_starts(c)
    if !c.has_registration_start_date? || !self.has_registration_start_date?
      return false
    end
    seconds_until = (c.registration_open - self.registration_open).to_i
    if seconds_until < 0
      seconds_until = (self.registration_open - c.registration_open).to_i * -1
    end
    seconds_until / 60
  end

  def announced?
    announced_at.present? && announced_by.present?
  end

  def cancelled?
    cancelled_at.present? && cancelled_by.present?
  end

  def can_be_cancelled?
    confirmed? && announced? && !cancelled?
  end

  def orga_can_close_reg_full_limit?
    registration_full? && registration_currently_open?
  end

  def display_name(short: false)
    data = short ? cellName : name
    if cancelled?
      I18n.t("competitions.competition_info.display_name", name: data)
    else
      data
    end
  end

  def short_display_name
    display_name(short: true)
  end

  def results_posted?
    results_posted_at.present? && results_posted_by.present?
  end

  def confirmed?
    !confirmed_at.nil?
  end

  def confirmed
    self.confirmed?
  end

  def confirmed=(new_confirmed_str)
    new_confirmed = ActiveRecord::Type::Boolean.new.cast(new_confirmed_str)
    self.confirmed_at = new_confirmed ? (self.confirmed_at || Time.now) : nil
  end

  def wca_live_link
    "https://live.worldcubeassociation.org/link/competitions/#{self.id}"
  end

  def results_submitted?
    !results_submitted_at.nil?
  end

  def user_can_view?(user)
    self.showAtAll || user&.can_manage_competition?(self)
  end

  def user_can_view_results?(user)
    (results_posted? || user&.can_admin_results?) && !results.empty?
  end

  def in_progress?
    # starting from Ruby 2.7, (nil..nil) is interpreted as an "endless range",
    # so if either date is nil then (start_date..end_date).cover? will always return true.
    # But in the WCA database, a competition with nil dates is undefined in the sense that it is *not* including today.
    # That's why the two extra nil? checks are absolutely necessary.
    !results_posted? && !start_date.nil? && !end_date.nil? && (start_date..end_date).cover?(Date.today)
  end

  def uses_cutoff?
    competition_events.any? { |ce| ce.rounds.any?(&:cutoff) }
  end

  def uses_cumulative?
    competition_events.any? { |ce| ce.rounds.any? { |r| r.time_limit.cumulative_round_ids.size == 1 } }
  end

  def uses_cumulative_across_rounds?
    competition_events.any? { |ce| ce.rounds.any? { |r| r.time_limit.cumulative_round_ids.size > 1 } }
  end

  def qualification_results?
    # we have NULL columns for historic data.
    # Explicitly exclude them rather than relying on Ruby "accidentally" evaluating nil as false-ish
    qualification_results == true
  end

  def uses_qualification?
    # We want to trigger the checks for qualification details even when
    # the actual qualification requirements have not been filled out yet for a newly created competition.
    # In other words, checking the `qualification_results` checkbox should be enough to trigger validations.
    self.qualification_results? || competition_events.any?(&:qualification)
  end

  def qualification_date_to_events
    competition_events.select(&:qualification).group_by { |e| e.qualification.when_date }
  end

  # The name `is_probably_over` is meant to be surprising.
  # We don't actually know when competitions are over, because we don't know their schedules, nor
  # do we know their timezones.
  # See discussion here: https://github.com/thewca/worldcubeassociation.org/pull/1206/files#r98485399.
  def is_probably_over?
    !end_date.nil? && end_date < Date.today
  end

  def upcoming?
    !results_posted? && (start_date.nil? || start_date > Date.today)
  end

  def city_and_country
    [cityName, country&.name].compact.join(', ')
  end

  def events_with_podium_results
    light_results_from_relation(
      results.podium.order(:pos),
    ).group_by(&:event)
      .sort_by { |event, _results| event.rank }
  end

  def winning_results
    light_results_from_relation(
      results.winners,
    )
  end

  def person_ids_with_results
    light_results_from_relation(results)
      .group_by(&:personId)
      .sort_by { |_personId, results| results.first.personName }
      .map do |personId, results|
        results.sort_by! { |r| [r.event.rank, -r.round_type.rank] }

        # Mute (soften) each result that wasn't the competitor's last for the event.
        last_event = nil
        results.each do |result|
          result.muted = (result.event == last_event)
          last_event = result.event
        end

        [personId, results.sort_by { |r| [r.event.rank, -r.round_type.rank] }]
      end
  end

  def events_with_round_types_with_results
    light_results_from_relation(results)
      .group_by(&:event)
      .sort_by { |event, _results| event.rank }
      .map do |event, results_for_event|
        round_types_with_results = results_for_event
                                   .group_by(&:round_type)
                                   .sort_by { |format, _results| format.rank }.reverse
                                   .map { |round_type, results| [round_type, results.sort_by { |r| [r.pos, r.personName] }] }

        [event, round_types_with_results]
      end
  end

  def ineligible_events(user)
    competition_events.select { |ce| !ce.can_register?(user) }.map(&:event)
  end

  # Profiling the rendering of _results_table.html.erb showed quite some
  # time was spent in `ActiveRecord#read_attribute`. So, I load the results
  # using raw SQL and instantiate a PORO. The code definitely got uglier,
  # but the performance gains are worth it IMO. Not using ActiveRecord led
  # to a 40% performance improvement.
  private def light_results_from_relation(relation)
    ActiveRecord::Base.connection
                      .execute(relation.to_sql)
                      .each(as: :hash).map do |r|
                        LightResult.new(r)
                      end
  end

  def started?
    start_date.present? && start_date < Date.today
  end

  def organizers_or_delegates
    self.organizers.empty? ? self.delegates : self.organizers
  end

  SortedRanking = Struct.new(
    :name,
    :user_id,
    :wca_id,
    :country_id,
    :average_best,
    :average_rank,
    :single_best,
    :single_rank,
    :tied_previous,
    :pos,
    keyword_init: true,
  )

  PsychSheet = Struct.new(
    :sorted_rankings,
    :sort_by,
    :sort_by_second,
    keyword_init: true,
  )

  def psych_sheet_event(event, sort_by)
    ActiveRecord::Base.connected_to(role: :read_replica) do
      competition_event = competition_events.find_by!(event: event)
      recommended_format = competition_event.recommended_format || event.recommended_format

      # Legacy code relies on there being a default behavior
      sort_by ||= recommended_format.sort_by

      if sort_by == recommended_format.sort_by
        sort_by_second = recommended_format.sort_by_second
      elsif sort_by == recommended_format.sort_by_second
        sort_by_second = recommended_format.sort_by
      else
        raise "Unknown 'sort_by' in psych sheet computation: #{sort_by}"
      end

      if self.uses_new_registration_service?
        # We deliberately don't go through the cached `microservice_registrations` table here, because then we
        # would need to separately check which of the cached registrations are accepted
        # and which of those are registered for the specified event. Querying the MS directly is much more efficient.
        accepted_registrations = Microservices::Registrations.registrations_by_competition(self.id, 'accepted', event.id, cache: false)
        registered_user_ids = accepted_registrations.map { |reg| reg['user_id'] }
      else
        registered_user_ids = self.registrations
                                  .accepted
                                  .includes(:registration_competition_events)
                                  .where(registration_competition_events: { competition_event: competition_event })
                                  .pluck(:user_id)
      end

      concise_results_date = ComputeAuxiliaryData.end_date || Date.current
      results_cache_key = ["psych-sheet", self.id, *registered_user_ids, concise_results_date]

      users_with_rankings = Rails.cache.fetch(results_cache_key) do
        # .includes doesn't work well here because under the hood, Rails will fire several calls:
        # SELECT * FROM users where id IN (...)
        # SELECT * FROM RanksSingle WHERE personId IN (...)
        # SELECT * FROM RanksAverage WHERE personId IN (...)
        #
        # By using eager_load, we explicitly force Rails to do one query like so:
        # SELECT * FROM users
        #   LEFT JOIN Persons
        #   LEFT JOIN RanksSingle
        #   LEFT JOIN RanksAverage
        # WHERE users.id IN (...)
        User.eager_load(:ranksSingle, :ranksAverage)
            .select(:name, :wca_id, :country_iso2)
            .find(registered_user_ids)
      end

      rank_symbol = :"ranks#{sort_by.capitalize}"
      second_rank_symbol = :"ranks#{sort_by_second.capitalize}"

      sorted_users = users_with_rankings.sort_by { |user|
        # using '.find_by(event: ...)' fires another SQL query *despite* the ranks being pre-loaded :facepalm:
        rank = user.send(rank_symbol).find { |r| r.event == event }
        second_rank = user.send(second_rank_symbol).find { |r| r.event == event }

        [
          # Competitors with ranks should appear first in the sorting,
          # competitors without ranks should appear last. That's why they get a higher number if rank is not present.
          rank.present? ? 0 : 1,
          rank&.worldRank || 0,
          second_rank.present? ? 0 : 1,
          second_rank&.worldRank || 0,
          user.name,
        ]
      }

      prev_sorted_ranking = nil

      sorted_rankings = sorted_users.map.with_index { |user, i|
        # see comment about .find vs .find_by above.
        single_ranking = user.ranksSingle.find { |r| r.event == event }
        average_ranking = user.ranksAverage.find { |r| r.event == event }

        sort_by_ranking = sort_by == 'single' ? single_ranking : average_ranking

        if sort_by_ranking.present?
          # Change position to previous if both single and average are tied with previous registration.
          average_tied_previous = average_ranking&.worldRank == prev_sorted_ranking&.average_rank
          single_tied_previous = single_ranking&.worldRank == prev_sorted_ranking&.single_rank

          tied_previous = single_tied_previous && average_tied_previous

          pos = tied_previous ? prev_sorted_ranking.pos : i + 1
        else
          # Hasn't competed in this event yet.
          tied_previous = nil
          pos = nil
        end

        sorted_ranking = SortedRanking.new(
          name: user.name,
          user_id: user.id,
          wca_id: user.wca_id,
          country_id: user.country.id,
          average_rank: average_ranking&.worldRank,
          average_best: average_ranking&.best || 0,
          single_rank: single_ranking&.worldRank,
          single_best: single_ranking&.best || 0,
          tied_previous: tied_previous,
          pos: pos,
        )

        prev_sorted_ranking = sorted_ranking
      }

      PsychSheet.new(
        sorted_rankings: sorted_rankings,
        sort_by: sort_by,
        sort_by_second: sort_by_second,
      )
    end
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_events.find_by_event_id(event.id) || competition_events.build(event_id: event.id)
    end
  end

  def self.years
    Competition.where(showAtAll: true).pluck(:start_date).map(&:year).uniq.sort!.reverse!
  end

  def self.non_future_years
    self.years.select { |y| y <= Date.today.year }
  end

  def self.search(query, params: {}, managed_by_user: nil)
    if managed_by_user
      competitions = Competition.managed_by(managed_by_user.id)
    else
      competitions = Competition.visible
    end

    if params[:continent].present?
      continent = Continent.find(params[:continent])
      if !continent
        raise WcaExceptions::BadApiParameter.new("Invalid continent: '#{params[:continent]}'")
      end
      competitions = competitions.joins('INNER JOIN Countries ON Competitions.countryId = Countries.id')
                                 .where('continentId = ?', continent.id)
    end

    if params[:country_iso2].present?
      country = Country.find_by_iso2(params[:country_iso2])
      if !country
        raise WcaExceptions::BadApiParameter.new("Invalid country_iso2: '#{params[:country_iso2]}'")
      end
      competitions = competitions.where(countryId: country.id)
    end

    if params[:delegate].present?
      delegate_user = User.find_by(wca_id: params[:delegate]) || User.find(params[:delegate])
      if !delegate_user || !delegate_user.delegate_status
        raise WcaExceptions::BadApiParameter.new("Invalid delegate: '#{params[:delegate]}'")
      end
      competitions = competitions.left_outer_joins(:delegates)
                                 .where('competition_delegates.delegate_id = ?', delegate_user.id)
    end

    if params[:start].present?
      start_date = Date.safe_parse(params[:start])
      if !start_date
        raise WcaExceptions::BadApiParameter.new("Invalid start: '#{params[:start]}'")
      end
      competitions = competitions.where("start_date >= ?", start_date)
    end

    if params[:end].present?
      end_date = Date.safe_parse(params[:end])
      if !end_date
        raise WcaExceptions::BadApiParameter.new("Invalid end: '#{params[:end]}'")
      end
      competitions = competitions.where("end_date <= ?", end_date)
    end

    if params[:ongoing_and_future].present?
      target_date = Date.safe_parse(params[:ongoing_and_future])
      if !target_date
        raise WcaExceptions::BadApiParameter.new("Invalid ongoing_and_future: '#{params[:ongoing_and_future]}'")
      end
      competitions = competitions.where("end_date >= ?", target_date)
    end

    if params[:announced_after].present?
      announced_date = Date.safe_parse(params[:announced_after])
      if !announced_date
        raise WcaExceptions::BadApiParameter.new("Invalid announced date: '#{params[:announced_after]}'")
      end
      competitions = competitions.where("announced_at > ?", announced_date)
    end

    if params[:admin_status].present?
      admin_status = params[:admin_status].to_s

      unless ["danger", "warning"].include?(admin_status)
        raise WcaExceptions::BadApiParameter.new("Invalid admin status: '#{params[:admin_status]}'")
      end

      num_days = {
        warning: Competition::REPORT_AND_RESULTS_DAYS_WARNING,
        danger: Competition::REPORT_AND_RESULTS_DAYS_DANGER,
      }[admin_status.to_sym]

      competitions = competitions.end_date_passed_since(num_days).pending_report_or_results_posting
    end

    query&.split&.each do |part|
      like_query = %w(id name cellName cityName countryId).map { |column| "Competitions.#{column} LIKE :part" }.join(" OR ")
      competitions = competitions.where(like_query, part: "%#{part}%")
    end

    orderable_fields = %i(name start_date end_date announced_at)
    if params[:sort]
      order = params[:sort].split(',')
                           .map do |part|
                             reverse, field = part.match(/^(-)?(\w+)$/).captures
                             [field.to_sym, reverse ? :desc : :asc]
                           end
                           .select { |field, _| orderable_fields.include?(field) }
                           .to_h
    else
      order = { start_date: :desc }
    end

    competitions.includes(:delegates, :organizers).order(**order)
  end

  def all_activities
    competition_venues.includes(venue_rooms: { schedule_activities: [child_activities: [:child_activities]] }).map(&:all_activities).flatten
  end

  def top_level_activities
    competition_venues.includes(venue_rooms: { schedule_activities: [:child_activities] }).map(&:top_level_activities).flatten
  end

  # See https://github.com/thewca/worldcubeassociation.org/wiki/wcif
  def to_wcif(authorized: false)
    {
      "formatVersion" => "1.0",
      "id" => id,
      "name" => name,
      "shortName" => cellName,
      "series" => part_of_competition_series? ? competition_series_wcif(authorized: authorized) : nil,
      "persons" => persons_wcif(authorized: authorized),
      "events" => events_wcif,
      "schedule" => schedule_wcif,
      "competitorLimit" => competitor_limit_enabled? ? competitor_limit : nil,
      "extensions" => wcif_extensions.map(&:to_wcif),
      "registrationInfo" => {
        "openTime" => registration_open&.iso8601,
        "closeTime" => registration_close&.iso8601,
        "baseEntryFee" => base_entry_fee_lowest_denomination,
        "currencyCode" => currency_code,
        "onTheSpotRegistration" => on_the_spot_registration,
        "useWcaRegistration" => use_wca_registration,
      },
    }
  end

  def to_competition_info
    options = {
      only: %w[id name website start_date registration_open registration_close announced_at cancelled_at end_date competitor_limit
               extra_registration_requirements enable_donations refund_policy_limit_date event_change_deadline_date waiting_list_deadline_date
               on_the_spot_registration on_the_spot_entry_fee_lowest_denomination qualification_results event_restrictions
               base_entry_fee_lowest_denomination currency_code allow_registration_edits allow_registration_self_delete_after_acceptance
               allow_registration_without_qualification refund_policy_percent use_wca_registration guests_per_registration_limit venue contact
               force_comment_in_registration use_wca_registration external_registration_page guests_entry_fee_lowest_denomination guest_entry_status
               information events_per_registration_limit],
      methods: %w[url website short_name city venue_address venue_details latitude_degrees longitude_degrees country_iso2 event_ids registration_currently_open?
                  main_event_id number_of_bookmarks using_payment_integrations? uses_qualification? uses_cutoff? competition_series_ids registration_full?],
      include: %w[delegates organizers],
    }
    self.as_json(options)
  end

  def competition_series_wcif(authorized: false)
    competition_series&.to_wcif(authorized: authorized)
  end

  def competition_series_ids
    competition_series&.competition_ids&.split(',') || []
  end

  def persons_wcif(authorized: false)
    managers = self.managers
    includes_associations = [
      { assignments: [:schedule_activity] },
      { user: {
        person: [:ranksSingle, :ranksAverage],
      } },
      :wcif_extensions,
    ]
    # V2 registrations store the event IDs in the microservice data, not in the monolith
    includes_associations << :events unless self.uses_new_registration_service?

    registrations_relation = self.uses_new_registration_service? ? self.microservice_registrations : self.registrations

    # NOTE: we're including non-competing registrations so that they can have job
    # assignments as well. These registrations don't have accepted?, but they
    # should appear in the WCIF.
    persons_wcif = registrations_relation.order(:id)
                                         .includes(includes_associations)
                                         .to_enum
                                         .with_index(1)
                                         .select { |r, registrant_id| authorized || r.wcif_status == "accepted" }
                                         .map do |r, registrant_id|
                                           managers.delete(r.user)
                                           r.user.to_wcif(self, r, registrant_id, authorized: authorized)
                                         end
    # NOTE: unregistered managers may generate N+1 queries on their personal bests,
    # but that's fine because there are very few of them!
    persons_wcif + managers.map { |m| m.to_wcif(self, authorized: authorized) }
  end

  def events_wcif
    includes_associations = [
      { rounds: [:competition_event, :wcif_extensions] },
      :wcif_extensions,
    ]
    competition_events
      .includes(includes_associations)
      .sort_by { |ce| ce.event.rank }
      .map(&:to_wcif)
  end

  def schedule_wcif
    competition_venues_includes_associations = [
      {
        venue_rooms: [
          :wcif_extensions,
          { schedule_activities: [{ child_activities: [:child_activities, :wcif_extensions] }, :wcif_extensions] },
        ],
      },
      :wcif_extensions,
    ]
    {
      "startDate" => start_date.to_s,
      "numberOfDays" => number_of_days,
      "venues" => competition_venues.includes(competition_venues_includes_associations).map(&:to_wcif),
    }
  end

  def set_wcif!(wcif, current_user)
    JSON::Validator.validate!(Competition.wcif_json_schema, wcif)

    ActiveRecord::Base.transaction do
      set_wcif_series!(wcif["series"], current_user) if wcif["series"]
      set_wcif_events!(wcif["events"], current_user) if wcif["events"]
      set_wcif_schedule!(wcif["schedule"], current_user) if wcif["schedule"]
      update_persons_wcif!(wcif["persons"], current_user) if wcif["persons"]
      WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
      set_wcif_competitor_limit!(wcif["competitorLimit"], current_user) if wcif["competitorLimit"]

      # Trigger validations on the competition itself, and throw an error to rollback if necessary.
      # Context: It is possible to patch a WCIF containing events/schedule/persons that are valid by themselves,
      #   but create an inconsistent state in the competition they're attached to. For example, you can add events
      #   that have qualification requirements via a perfectly valid Events WCIF, but the competition itself
      #   was never configured to support qualifications (i.e. the use of qualifications was never approved by WCAT).
      save!

      # After validations succeeded, and we know that we have a consistent competition state, mark the competition as updated.
      # Context: As above, it is possible to make a PATCH call that _only_ updates associated models but not the competition
      #   itself in the stricter sense (i.e. only changes stuff in the `assignments` table but not the `competitions` table itself).
      #   But our API relies on the updated_at timestamp of the top-level Competition object to enable Conditional GET, so we
      #   artificially pretend like the Competition object was updated anyways.
      touch
    end
  end

  def set_wcif_competitor_limit!(wcif_competitor_limit, current_user)
    return if wcif_competitor_limit == self.competitor_limit

    if confirmed? && !current_user.can_admin_competitions?
      raise WcaExceptions::BadApiParameter.new("Cannot edit the competitor limit because the competition has been confirmed by WCAT")
    end

    unless competitor_limit_enabled?
      raise WcaExceptions::BadApiParameter.new("Cannot update the competitor limit because competitor limits are not enabled for this competition")
    end

    unless wcif_competitor_limit.present?
      raise WcaExceptions::BadApiParameter.new("Cannot remove competitor limit")
    end

    self.competitor_limit = wcif_competitor_limit
  end

  def set_wcif_series!(wcif_series, current_user)
    unless current_user.can_update_competition_series?(self)
      raise WcaExceptions::BadApiParameter.new("Cannot change Competition Series")
    end

    unless wcif_series["competitionIds"].include?(self.id)
      raise WcaExceptions::BadApiParameter.new("The Series must include the competition you're currently editing.")
    end

    competition_series = CompetitionSeries.find_by_wcif_id(wcif_series["id"]) || CompetitionSeries.new
    competition_series.set_wcif!(wcif_series)

    self.competition_series = competition_series
  end

  def set_wcif_events!(wcif_events, current_user)
    # Remove extra events.
    competition_events_includes_assotiations = [
      { rounds: [:competition_event, :wcif_extensions] },
      :wcif_extensions,
    ]
    self.competition_events.includes(competition_events_includes_assotiations).each do |competition_event|
      wcif_event = wcif_events.find { |e| e["id"] == competition_event.event.id }
      event_to_be_removed = !wcif_event || !wcif_event["rounds"]
      if event_to_be_removed
        unless current_user.can_add_and_remove_events?(self)
          raise WcaExceptions::BadApiParameter.new("Cannot remove events")
        end
        competition_event.destroy!
      end
    end

    # Create missing events.
    wcif_events.each do |wcif_event|
      event_found = competition_events.find { |ce| ce.event_id == wcif_event["id"] }
      event_to_be_added = wcif_event["rounds"]
      if !event_found && event_to_be_added
        unless current_user.can_add_and_remove_events?(self)
          raise WcaExceptions::BadApiParameter.new("Cannot add events")
        end
        competition_events.create!(event_id: wcif_event["id"])
      end
    end

    # Update all events.
    wcif_events.each do |wcif_event| # rubocop:disable Style/CombinableLoops
      event_to_be_updated = wcif_event["rounds"]
      if event_to_be_updated
        unless current_user.can_update_events?(self)
          raise WcaExceptions::BadApiParameter.new("Cannot update events")
        end
        competition_events.find { |ce| ce.event_id == wcif_event["id"] }.load_wcif!(wcif_event)
      end
    end

    reload
  end

  # Takes an array of partial Person WCIF and updates the fields that are not immutable.
  def update_persons_wcif!(wcif_persons, current_user)
    registrations_relation = self.uses_new_registration_service? ? self.microservice_registrations : self.registrations
    registration_includes = [
      { assignments: [:schedule_activity] },
      :user,
      :wcif_extensions,
    ]
    registration_includes << :registration_competition_events unless self.uses_new_registration_service?
    registrations = registrations_relation.includes(registration_includes)
    competition_activities = all_activities
    new_assignments = []
    removed_assignments = []
    wcif_persons.each do |wcif_person|
      local_assignments = []
      registration = registrations.find { |reg| reg.user_id == wcif_person["wcaUserId"] }
      # If no registration is found, and the Registration is marked as non-competing, add this person as a non-competing staff member.
      adding_non_competing = wcif_person["registration"].present? && wcif_person["registration"]["isCompeting"] == false
      if adding_non_competing
        registration ||= registrations.create(
          competition: self,
          user_id: wcif_person["wcaUserId"],
          is_competing: false,
        )
      end
      next unless registration.present?
      WcifExtension.update_wcif_extensions!(registration, wcif_person["extensions"]) if wcif_person["extensions"]
      # NOTE: person doesn't necessarily have corresponding registration (e.g. registratinless organizer/delegate).
      if wcif_person["roles"]
        roles = wcif_person["roles"] - ["delegate", "trainee-delegate", "organizer"] # These three are added on the fly.
        # The additional roles are only for WCIF purposes and we don't validate them,
        # so we can safely skip validations by using update_attribute
        registration.update_attribute(:roles, roles)
      end
      if wcif_person["assignments"]
        wcif_person["assignments"].each do |assignment_wcif|
          schedule_activity = competition_activities.find do |competition_activity|
            competition_activity.wcif_id == assignment_wcif["activityId"]
          end
          unless schedule_activity
            raise WcaExceptions::BadApiParameter.new("Cannot create assignment for non-existent activity with id #{assignment_wcif["activityId"]}")
          end
          assignment = registration.assignments.find do |a|
            a.wcif_equal?(assignment_wcif)
          end
          # We need to be very careful about how we build the assignment:
          # providing just the registration_id or the schedule_activity_id would
          # actually trigger a select for each validation.
          assignment ||= registration.assignments.build(
            schedule_activity: schedule_activity,
          )
          assignment.assign_attributes(
            station_number: assignment_wcif["stationNumber"],
            assignment_code: assignment_wcif["assignmentCode"],
          )
          if assignment.valid?
            local_assignments << assignment
          else
            raise WcaExceptions::BadApiParameter.new("Invalid assignment: #{a.errors.map(&:full_message)} for #{assignment_wcif}")
          end
        end
      end
      new_assignments.concat(local_assignments.map(&:attributes))
      removed_assignments.concat(registration.assignments.ids - local_assignments.map(&:id))
    end
    Assignment.where(id: removed_assignments).delete_all if removed_assignments.any?
    Assignment.upsert_all(new_assignments) if new_assignments.any?
  end

  def set_wcif_schedule!(wcif_schedule, current_user)
    if wcif_schedule["startDate"] != start_date.strftime("%F")
      raise WcaExceptions::BadApiParameter.new("Wrong start date for competition")
    elsif wcif_schedule["numberOfDays"] != number_of_days
      raise WcaExceptions::BadApiParameter.new("Wrong number of days for competition")
    end
    competition_venues = self.competition_venues.includes [
      {
        venue_rooms: [
          :wcif_extensions,
          { schedule_activities: [{ child_activities: [:child_activities, :wcif_extensions] }, :wcif_extensions] },
        ],
      },
      :wcif_extensions,
    ]
    new_venues = wcif_schedule["venues"].map do |venue_wcif|
      # using this find instead of ActiveRecord's find_or_create_by avoid several queries
      # (despite having the association included :()
      venue = competition_venues.find { |v| v.wcif_id == venue_wcif["id"] } || competition_venues.build
      venue.load_wcif!(venue_wcif)
    end
    self.competition_venues = new_venues

    reload
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "formatVersion" => { "type" => "string" },
        "id" => { "type" => "string" },
        "name" => { "type" => "string" },
        "shortName" => { "type" => "string" },
        "series" => CompetitionSeries.wcif_json_schema,
        "persons" => { "type" => "array", "items" => User.wcif_json_schema },
        "events" => { "type" => "array", "items" => CompetitionEvent.wcif_json_schema },
        "schedule" => {
          "type" => "object",
          "properties" => {
            "venues" => { "type" => "array", "items" => CompetitionVenue.wcif_json_schema },
            "startDate" => { "type" => "string" },
            "numberOfDays" => { "type" => "integer" },
          },
        },
        "competitorLimit" => { "type" => ["integer", "null"] },
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
        "registrationInfo" => {
          "type" => "object",
          "properties" => {
            "openTime" => { "type" => "string" },
            "closeTime" => { "type" => "string" },
            "baseEntryFee" => { "type" => "integer" },
            "currencyCode" => { "type" => "string" },
            "onTheSpotRegistration" => { "type" => "boolean" },
            "useWcaRegistration" => { "type" => "boolean" },
          },
        },
      },
    }
  end

  alias_attribute :venue_address, :venueAddress
  alias_attribute :venue_details, :venueDetails
  alias_attribute :short_name, :cellName
  alias_attribute :city, :cityName

  def country_iso2
    country&.iso2
  end

  def url
    Rails.application.routes.url_helpers.competition_url(self, host: EnvConfig.ROOT_URL)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "name", "website", "start_date", "end_date",
           "registration_open", "registration_close", "announced_at",
           "cancelled_at", "results_posted_at", "competitor_limit", "venue"],
    methods: ["url", "website", "short_name", "short_display_name", "city",
              "venue_address", "venue_details", "latitude_degrees", "longitude_degrees",
              "country_iso2", "event_ids", "time_until_registration", "date_range"],
    include: ["delegates", "organizers"],
  }.freeze

  def serializable_hash(options = nil)
    # The intent behind this is to have a "good" default setup for serialization.
    # We also want the caller to be able to be picky about the attributes included
    # in the json (eg: specify an empty 'methods' to remove these attributes,
    # or set a custom array in 'only' without getting the default ones), therefore
    # we only use 'merge' here, which doesn't "deeply" merge into the default options.
    options = DEFAULT_SERIALIZE_OPTIONS.merge(options || {}).deep_dup

    # Fallback to the default 'serializable_hash' method BUT...
    json = super

    # ...always include our custom 'class' attribute.
    # We can't put that in our DEFAULT_SERIALIZE_OPTIONS because the 'class'
    # method already exists, and we definitely don't want to override it, nor do
    # we want to change the existing behavior of our API which returns a string.
    json.merge!(
      class: self.class.to_s.downcase,
    )
  end

  def to_ics
    cal = Icalendar::Calendar.new
    wcif_ids = rounds.to_h { |r| [r.wcif_id, r.to_string_map] }
    all_activities.each do |activity|
      event = Icalendar::Event.new
      event.dtstart = Icalendar::Values::DateTime.new(activity.start_time, "TZID" => "Etc/UTC")
      event.dtend = Icalendar::Values::DateTime.new(activity.end_time, "TZID" => "Etc/UTC")
      event.summary = activity.localized_name(wcif_ids)
      cal.add_event(event)
    end
    cal.publish
    cal
  end

  def world_or_continental_championship?
    championships.map(&:championship_type).any? { |ct| Championship::MAJOR_CHAMPIONSHIP_TYPES.include?(ct) }
  end

  def multi_country_fmc_competition?
    events.length == 1 && events[0].fewest_moves? && Country::FICTIVE_IDS.include?(countryId)
  end

  def exempt_from_wca_dues?
    world_or_continental_championship? || multi_country_fmc_competition?
  end

  validate :series_siblings_must_be_valid
  private def series_siblings_must_be_valid
    if part_of_competition_series?
      series_sibling_competitions.each do |comp|
        unless self.distance_adjacent_to?(comp, CompetitionSeries::MAX_SERIES_DISTANCE_KM)
          errors.add(:competition_series, I18n.t('competitions.errors.series_distance_km', competition: comp.name))
        end
        unless self.start_date_adjacent_to?(comp, CompetitionSeries::MAX_SERIES_DISTANCE_DAYS)
          errors.add(:competition_series, I18n.t('competitions.errors.series_distance_days', competition: comp.name))
        end
      end
    end
  end

  after_update :clean_series_when_leaving
  private def clean_series_when_leaving
    if competition_series_id.nil? && # if we just processed an update to remove the competition series
       (old_series_id = competition_series_id_previously_was) && # and we previously had an ID
       (old_series = CompetitionSeries.find_by_id(old_series_id)) # and that series still exists
      old_series.reload.destroy_if_orphaned # prompt it to check for orphaned state.
    end
  end

  def part_of_competition_series?
    !competition_series_id.nil?
  end

  def series_sibling_competitions
    return [] unless part_of_competition_series?

    series_competitions
      .where.not(id: self.id)
  end

  def find_round_for(event_id, round_type_id, format_id = nil)
    rounds.find do |r|
      r.event.id == event_id && r.round_type_id == round_type_id &&
        (format_id.nil? || format_id == r.format_id)
    end
  end

  def dues_per_competitor_in_usd
    dues = DuesCalculator.dues_per_competitor_in_usd(self.country_iso2, self.base_entry_fee_lowest_denomination.to_i, self.currency_code)
    dues.present? ? dues : 0
  end

  private def xero_dues_payer
    (
      self.country&.wfc_dues_redirect&.redirect_to ||
        self.organizers.find { |organizer| organizer.wfc_dues_redirect.present? }&.wfc_dues_redirect&.redirect_to
    )
  end

  # WFC usually sends dues to the first staff delegate in alphabetical order if there are no redirects setup for the country or organizer.
  private def delegate_dues_payer
    staff_delegates.min_by(&:name)
  end

  def dues_payer_name
    dues_payer = xero_dues_payer || delegate_dues_payer
    dues_payer&.name
  end

  def dues_payer_email
    dues_payer = xero_dues_payer || delegate_dues_payer
    dues_payer&.email
  end

  def dues_payer_is_combined_invoice?
    xero_dues_payer&.is_combined_invoice || false
  end

  def to_form_data
    {
      # TODO: enable this once we have persistent IDs
      # "id" => id,
      "competitionId" => id,
      "name" => name,
      "shortName" => cellName,
      "nameReason" => name_reason,
      "venue" => {
        "countryId" => countryId,
        "cityName" => cityName,
        "name" => venue,
        "details" => venueDetails,
        "address" => venueAddress,
        "coordinates" => {
          "lat" => latitude_degrees || 0,
          "long" => longitude_degrees || 0,
        },
      },
      "startDate" => start_date&.iso8601,
      "endDate" => end_date&.iso8601,
      "series" => competition_series&.to_form_data,
      "information" => information,
      "competitorLimit" => {
        "enabled" => competitor_limit_enabled,
        "count" => competitor_limit,
        "reason" => competitor_limit_reason,
      },
      "staff" => {
        "staffDelegateIds" => staff_delegates.to_a.pluck(:id),
        "traineeDelegateIds" => trainee_delegates.to_a.pluck(:id),
        "organizerIds" => organizers.to_a.pluck(:id),
        "contact" => contact,
      },
      "championships" => championships.map(&:championship_type),
      "website" => {
        "generateWebsite" => generate_website,
        "externalWebsite" => external_website,
        "externalRegistrationPage" => external_registration_page,
        "usesWcaRegistration" => use_wca_registration,
        "usesWcaLive" => use_wca_live_for_scoretaking,
      },
      "entryFees" => {
        "currencyCode" => currency_code,
        "baseEntryFee" => base_entry_fee_lowest_denomination,
        "onTheSpotEntryFee" => on_the_spot_entry_fee_lowest_denomination,
        "guestEntryFee" => guests_entry_fee_lowest_denomination,
        "donationsEnabled" => enable_donations,
        "refundPolicyPercent" => refund_policy_percent,
        "refundPolicyLimitDate" => refund_policy_limit_date&.iso8601,
      },
      "registration" => {
        "openingDateTime" => registration_open&.iso8601,
        "closingDateTime" => registration_close&.iso8601,
        "waitingListDeadlineDate" => waiting_list_deadline_date&.iso8601,
        "eventChangeDeadlineDate" => event_change_deadline_date&.iso8601,
        "allowOnTheSpot" => on_the_spot_registration,
        "allowSelfDeleteAfterAcceptance" => allow_registration_self_delete_after_acceptance,
        "allowSelfEdits" => allow_registration_edits,
        "guestsEnabled" => guests_enabled,
        "guestEntryStatus" => guest_entry_status,
        "guestsPerRegistration" => guests_per_registration_limit,
        "extraRequirements" => extra_registration_requirements,
        "forceComment" => force_comment_in_registration,
      },
      "eventRestrictions" => {
        "forbidNewcomers" => {
          "enabled" => forbid_newcomers?,
          "reason" => forbid_newcomers_reason,
        },
        "earlyPuzzleSubmission" => {
          "enabled" => early_puzzle_submission?,
          "reason" => early_puzzle_submission_reason,
        },
        "qualificationResults" => {
          "enabled" => qualification_results?,
          "reason" => qualification_results_reason,
          "allowRegistrationWithout" => allow_registration_without_qualification,
        },
        "eventLimitation" => {
          "enabled" => event_restrictions?,
          "reason" => event_restrictions_reason,
          "perRegistrationLimit" => events_per_registration_limit,
        },
        "mainEventId" => main_event_id,
      },
      "remarks" => remarks,
      "admin" => {
        "isConfirmed" => confirmed?,
        "isVisible" => showAtAll?,
      },
      "cloning" => {
        "fromId" => being_cloned_from_id,
        "cloneTabs" => clone_tabs || false,
      },
    }
  end

  # It is quite uncool that we have to duplicate the internal form_data formatting like this
  # but as long as we let our backend handle the complete error validation we literally have no other choice
  def form_errors
    return {} if self.valid?

    {
      # for historic reasons, we keep 'name' errors listed under ID. Don't ask.
      "competitionId" => self.persisted? ? (errors[:id] + errors[:name]) : [],
      "name" => self.persisted? ? [] : (errors[:id] + errors[:name]),
      "shortName" => errors[:cellName],
      "nameReason" => errors[:name_reason],
      "venue" => {
        "countryId" => errors[:countryId],
        "cityName" => errors[:cityName],
        "name" => errors[:venue],
        "details" => errors[:venueDetails],
        "address" => errors[:venueAddress],
        "coordinates" => {
          "lat" => errors[:latitude],
          "long" => errors[:longitude],
        },
      },
      "startDate" => errors[:start_date],
      "endDate" => errors[:end_date],
      "series" => competition_series&.valid? ? [] : competition_series&.form_errors,
      "information" => errors[:information],
      "competitorLimit" => {
        "enabled" => errors[:competitor_limit_enabled],
        "count" => errors[:competitor_limit],
        "reason" => errors[:competitor_limit_reason],
      },
      "staff" => {
        "staffDelegateIds" => errors[:staff_delegate_ids],
        "traineeDelegateIds" => errors[:trainee_delegate_ids],
        "organizerIds" => errors[:organizer_ids],
        "contact" => errors[:contact],
      },
      "championships" => errors[:championships],
      "website" => {
        "generateWebsite" => errors[:generate_website],
        "externalWebsite" => errors[:external_website],
        "externalRegistrationPage" => errors[:external_registration_page],
        "usesWcaRegistration" => errors[:use_wca_registration],
        "usesWcaLive" => errors[:use_wca_live_for_scoretaking],
      },
      "entryFees" => {
        "currencyCode" => errors[:currency_code],
        "baseEntryFee" => errors[:base_entry_fee_lowest_denomination],
        "onTheSpotEntryFee" => errors[:on_the_spot_entry_fee_lowest_denomination],
        "guestEntryFee" => errors[:guests_entry_fee_lowest_denomination],
        "donationsEnabled" => errors[:enable_donations],
        "refundPolicyPercent" => errors[:refund_policy_percent],
        "refundPolicyLimitDate" => errors[:refund_policy_limit_date],
      },
      "registration" => {
        "openingDateTime" => errors[:registration_open],
        "closingDateTime" => errors[:registration_close],
        "waitingListDeadlineDate" => errors[:waiting_list_deadline_date],
        "eventChangeDeadlineDate" => errors[:event_change_deadline_date],
        "allowOnTheSpot" => errors[:on_the_spot_registration],
        "allowSelfDeleteAfterAcceptance" => errors[:allow_registration_self_delete_after_acceptance],
        "allowSelfEdits" => errors[:allow_registration_edits],
        "guestsEnabled" => errors[:guests_enabled],
        "guestEntryStatus" => errors[:guest_entry_status],
        "guestsPerRegistration" => errors[:guests_per_registration_limit],
        "extraRequirements" => errors[:extra_registration_requirements],
        "forceComment" => errors[:force_comment_in_registration],
      },
      "eventRestrictions" => {
        "forbidNewcomers" => {
          "enabled" => errors[:forbid_newcomers],
          "reason" => errors[:forbid_newcomers_reason],
        },
        "earlyPuzzleSubmission" => {
          "enabled" => errors[:early_puzzle_submission],
          "reason" => errors[:early_puzzle_submission_reason],
        },
        "qualificationResults" => {
          "enabled" => errors[:qualification_results],
          "reason" => errors[:qualification_results_reason],
          "allowRegistrationWithout" => errors[:allow_registration_without_qualification],
        },
        "eventLimitation" => {
          "enabled" => errors[:event_restrictions],
          "reason" => errors[:event_restrictions_reason],
          "perRegistrationLimit" => errors[:events_per_registration_limit],
        },
        "mainEventId" => errors[:main_event_id],
      },
      "remarks" => errors[:remarks],
      "admin" => {
        "isConfirmed" => errors[:confirmed_at],
        "isVisible" => errors[:showAtAll],
      },
      "cloning" => {
        "fromId" => errors[:being_cloned_from_id],
        "cloneTabs" => errors[:clone_tabs],
      },
      "other" => {
        "competitionEvents" => errors[:competition_events],
      },
    }
  end

  def set_form_data(form_data, current_user)
    JSON::Validator.validate!(Competition.form_data_json_schema, form_data)

    if self.confirmed? && !current_user.can_admin_competitions?
      raise WcaExceptions::BadApiParameter.new("Cannot change announced competition")
    end

    ActiveRecord::Base.transaction do
      self.editing_user_id = current_user.id

      if (form_series = form_data["series"]).present?
        set_form_data_series(form_series, current_user)
      else
        self.competition_series = nil
      end

      if (form_championships = form_data["championships"]).present?
        self.championships = form_championships.map do |type|
          Championship.new(championship_type: type)
        end
      else
        # explicitly sending an empty array of championships
        #   (which prominently happens when removing the only championship there is)
        #   makes `present?` return `false`, so we explicitly set this default value.
        self.championships = []
      end

      assign_attributes(Competition.form_data_to_attributes(form_data))
    end
  end

  def self.form_data_to_attributes(form_data)
    {
      id: form_data['competitionId'],
      name: form_data['name'],
      cityName: form_data.dig('venue', 'cityName'),
      countryId: form_data.dig('venue', 'countryId'),
      information: form_data['information'],
      venue: form_data.dig('venue', 'name'),
      venueAddress: form_data.dig('venue', 'address'),
      venueDetails: form_data.dig('venue', 'details'),
      external_website: form_data.dig('website', 'externalWebsite'),
      cellName: form_data['shortName'],
      latitude_degrees: form_data.dig('venue', 'coordinates', 'lat'),
      longitude_degrees: form_data.dig('venue', 'coordinates', 'long'),
      staff_delegate_ids: form_data.dig('staff', 'staffDelegateIds')&.join(','),
      trainee_delegate_ids: form_data.dig('staff', 'traineeDelegateIds')&.join(','),
      organizer_ids: form_data.dig('staff', 'organizerIds')&.join(','),
      contact: form_data.dig('staff', 'contact'),
      remarks: form_data['remarks'],
      registration_open: form_data.dig('registration', 'openingDateTime')&.presence,
      registration_close: form_data.dig('registration', 'closingDateTime')&.presence,
      use_wca_registration: form_data.dig('website', 'usesWcaRegistration'),
      guests_enabled: form_data.dig('registration', 'guestsEnabled'),
      generate_website: form_data.dig('website', 'generateWebsite'),
      base_entry_fee_lowest_denomination: form_data.dig('entryFees', 'baseEntryFee'),
      currency_code: form_data.dig('entryFees', 'currencyCode'),
      start_date: form_data['startDate']&.presence,
      end_date: form_data['endDate']&.presence,
      enable_donations: form_data.dig('entryFees', 'donationsEnabled'),
      competitor_limit_enabled: form_data.dig('competitorLimit', 'enabled'),
      competitor_limit: form_data.dig('competitorLimit', 'count'),
      competitor_limit_reason: form_data.dig('competitorLimit', 'reason'),
      extra_registration_requirements: form_data.dig('registration', 'extraRequirements'),
      on_the_spot_registration: form_data.dig('registration', 'allowOnTheSpot'),
      on_the_spot_entry_fee_lowest_denomination: form_data.dig('entryFees', 'onTheSpotEntryFee'),
      refund_policy_percent: form_data.dig('entryFees', 'refundPolicyPercent'),
      refund_policy_limit_date: form_data.dig('entryFees', 'refundPolicyLimitDate')&.presence,
      guests_entry_fee_lowest_denomination: form_data.dig('entryFees', 'guestEntryFee'),
      early_puzzle_submission: form_data.dig('eventRestrictions', 'earlyPuzzleSubmission', 'enabled'),
      early_puzzle_submission_reason: form_data.dig('eventRestrictions', 'earlyPuzzleSubmission', 'reason'),
      forbid_newcomers: form_data.dig('eventRestrictions', 'forbidNewcomers', 'enabled'),
      forbid_newcomers_reason: form_data.dig('eventRestrictions', 'forbidNewcomers', 'reason'),
      qualification_results: form_data.dig('eventRestrictions', 'qualificationResults', 'enabled'),
      qualification_results_reason: form_data.dig('eventRestrictions', 'qualificationResults', 'reason'),
      name_reason: form_data['nameReason'],
      external_registration_page: form_data.dig('website', 'externalRegistrationPage'),
      event_restrictions: form_data.dig('eventRestrictions', 'eventLimitation', 'enabled'),
      event_restrictions_reason: form_data.dig('eventRestrictions', 'eventLimitation', 'reason'),
      main_event_id: form_data.dig('eventRestrictions', 'mainEventId'),
      waiting_list_deadline_date: form_data.dig('registration', 'waitingListDeadlineDate')&.presence,
      event_change_deadline_date: form_data.dig('registration', 'eventChangeDeadlineDate')&.presence,
      guest_entry_status: form_data.dig('registration', 'guestEntryStatus'),
      allow_registration_edits: form_data.dig('registration', 'allowSelfEdits'),
      allow_registration_self_delete_after_acceptance: form_data.dig('registration', 'allowSelfDeleteAfterAcceptance'),
      use_wca_live_for_scoretaking: form_data.dig('website', 'usesWcaLive'),
      allow_registration_without_qualification: form_data.dig('eventRestrictions', 'qualificationResults', 'allowRegistrationWithout'),
      guests_per_registration_limit: form_data.dig('registration', 'guestsPerRegistration'),
      events_per_registration_limit: form_data.dig('eventRestrictions', 'eventLimitation', 'perRegistrationLimit'),
      force_comment_in_registration: form_data.dig('registration', 'forceComment'),
      confirmed: form_data.dig('admin', 'isConfirmed'),
      showAtAll: form_data.dig('admin', 'isVisible'),
      being_cloned_from_id: form_data.dig('cloning', 'fromId'),
      clone_tabs: form_data.dig('cloning', 'cloneTabs'),
    }
  end

  def set_form_data_series(form_data_series, current_user)
    unless current_user.can_update_competition_series?(self)
      raise WcaExceptions::BadApiParameter.new("Cannot change Competition Series")
    end

    unless form_data_series["competitionIds"].include?(self.id)
      raise WcaExceptions::BadApiParameter.new("The Series must include the competition you're currently editing.")
    end

    competition_series = form_data_series["id"].present? ? CompetitionSeries.find(form_data_series["id"]) : CompetitionSeries.new
    competition_series.set_form_data(form_data_series)

    self.competition_series = competition_series
  end

  def payments_enabled?
    competition_payment_integrations.exists?
  end

  def connected_payment_integration_types
    raw_types = self.competition_payment_integrations.pluck(:connected_account_type)
    raw_types.map { |type| CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS.invert[type] }
  end

  def payment_integration_connected?(integration_name)
    CompetitionPaymentIntegration.validate_integration_name!(integration_name)

    self.competition_payment_integrations.send(integration_name.to_sym).exists?
  end

  def stripe_connected?
    self.payment_integration_connected?(:stripe)
  end

  def paypal_connected?
    self.payment_integration_connected?(:paypal)
  end

  def payment_account_for(integration_name)
    CompetitionPaymentIntegration.validate_integration_name!(integration_name)

    competition_payment_integrations.find_by(
      connected_account_type: CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[integration_name],
    )&.connected_account
  end

  def disconnect_payment_integration(integration_name)
    CompetitionPaymentIntegration.validate_integration_name!(integration_name)

    competition_payment_integrations.destroy_by(
      connected_account_type: CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[integration_name],
    )
  end

  def disconnect_all_payment_integrations
    competition_payment_integrations.destroy_all
  end

  # Our React date picker unfortunately behaves weirdly in terms of backend data
  def self.date_json_schema(string_format)
    {
      "anyOf" => [
        # It can (and should) mostly be a "date" or "date-time" string
        { "type" => "string", "format" => string_format },
        # but when opening the page **and never touching it** it stays NULL
        { "type" => "null" },
        # and when opening and touching **but later deleting** a date it becomes an empty string instead of NULL
        { "type" => "string", "maxLength" => 0 },
      ],
    }
  end

  def self.form_data_json_schema
    {
      "type" => "object",
      "properties" => {
        # TODO: See above in to_form_data
        # "id" => { "type" => "string" },
        "competitionId" => { "type" => "string" },
        "name" => { "type" => "string" },
        "shortName" => { "type" => "string" },
        "nameReason" => { "type" => ["string", "null"] },
        "venue" => {
          "type" => "object",
          "properties" => {
            "name" => { "type" => "string" },
            "cityName" => { "type" => "string" },
            "countryId" => { "type" => "string" },
            "details" => { "type" => ["string", "null"] },
            "address" => { "type" => ["string", "null"] },
            "coordinates" => {
              "type" => "object",
              "properties" => {
                "lat" => { "type" => ["number", "string"] },
                "long" => { "type" => ["number", "string"] },
              },
            },
          },
        },
        "startDate" => date_json_schema("date"),
        "endDate" => date_json_schema("date"),
        "series" => CompetitionSeries.form_data_json_schema,
        "information" => { "type" => ["string", "null"] },
        "competitorLimit" => {
          "type" => "object",
          "properties" => {
            "enabled" => { "type" => ["boolean", "null"] },
            "count" => { "type" => ["integer", "null"] },
            "reason" => { "type" => ["string", "null"] },
          },
        },
        "staff" => {
          "type" => "object",
          "properties" => {
            "staffDelegateIds" => {
              "type" => "array",
              "items" => { "type" => "integer" },
              "uniqueItems" => true,
            },
            "traineeDelegateIds" => {
              "type" => "array",
              "items" => { "type" => "integer" },
              "uniqueItems" => true,
            },
            "organizerIds" => {
              "type" => "array",
              "items" => { "type" => "integer" },
              "uniqueItems" => true,
            },
            "contact" => { "type" => ["string", "null"] },
          },
        },
        "championships" => {
          "type" => "array",
          "items" => { "type" => "string" },
          "uniqueItems" => true,
        },
        "website" => {
          "type" => "object",
          "properties" => {
            "generateWebsite" => { "type" => ["boolean", "null"] },
            "externalWebsite" => { "type" => ["string", "null"] },
            "externalRegistrationPage" => { "type" => ["string", "null"] },
            "usesWcaRegistration" => { "type" => "boolean" },
            "usesWcaLive" => { "type" => "boolean" },
          },
        },
        "userSettings" => {
          "type" => "object",
          "properties" => {
            "receiveRegistrationEmails" => { "type" => "boolean" },
          },
        },
        "entryFees" => {
          "type" => "object",
          "properties" => {
            "currencyCode" => { "type" => "string" },
            "baseEntryFee" => { "type" => ["integer", "null"] },
            "onTheSpotEntryFee" => { "type" => ["integer", "null"] },
            "guestEntryFee" => { "type" => ["integer", "null"] },
            "donationsEnabled" => { "type" => ["boolean", "null"] },
            "refundPolicyPercent" => { "type" => ["integer", "null"] },
            "refundPolicyLimitDate" => date_json_schema("date-time"),
          },
        },
        "registration" => {
          "type" => "object",
          "properties" => {
            "openingDateTime" => date_json_schema("date-time"),
            "closingDateTime" => date_json_schema("date-time"),
            "waitingListDeadlineDate" => date_json_schema("date-time"),
            "eventChangeDeadlineDate" => date_json_schema("date-time"),
            "allowOnTheSpot" => { "type" => ["boolean", "null"] },
            "allowSelfDeleteAfterAcceptance" => { "type" => "boolean" },
            "allowSelfEdits" => { "type" => "boolean" },
            "guestsEnabled" => { "type" => "boolean" },
            "guestEntryStatus" => { "type" => "string" },
            "guestsPerRegistration" => { "type" => ["integer", "null"] },
            "extraRequirements" => { "type" => ["string", "null"] },
            "forceComment" => { "type" => ["boolean", "null"] },
          },
        },
        "eventRestrictions" => {
          "type" => "object",
          "properties" => {
            "forbidNewcomers" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => ["string", "null"] },
              },
            },
            "earlyPuzzleSubmission" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => ["string", "null"] },
              },
            },
            "qualificationResults" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => ["string", "null"] },
                "allowRegistrationWithout" => { "type" => ["boolean", "null"] },
              },
            },
            "eventLimitation" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => ["string", "null"] },
                "perRegistrationLimit" => { "type" => ["integer", "null"] },
              },
            },
            "mainEventId" => { "type" => ["string", "null"] },
          },
        },
        "remarks" => { "type" => ["string", "null"] },
        "admin" => {
          "type" => "object",
          "properties" => {
            "isConfirmed" => { "type" => "boolean" },
            "isVisible" => { "type" => "boolean" },
          },
        },
        "cloning" => {
          "type" => "object",
          "properties" => {
            "fromId" => { "type" => ["string", "null"] },
            "cloneTabs" => { "type" => "boolean" },
          },
        },
      },
    }
  end
end
