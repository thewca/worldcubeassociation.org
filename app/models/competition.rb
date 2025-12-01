# frozen_string_literal: true

class Competition < ApplicationRecord
  # We need this default order, tests rely on it.
  has_many :competition_events, -> { order(:event_id) }, dependent: :destroy
  has_many :events, through: :competition_events
  has_many :rounds, through: :competition_events
  has_many :registrations, dependent: :destroy
  has_many :results
  has_many :scrambles, -> { order(:group_id, :is_extra, :scramble_num) }
  has_many :uploaded_jsons, dependent: :destroy
  has_many :competitors, -> { distinct }, through: :results, source: :person
  has_many :competitor_users, -> { distinct }, through: :competitors, source: :user
  has_many :competition_delegates, dependent: :delete_all
  has_many :delegates, -> { includes(:delegate_roles, :delegate_role_metadata).distinct }, through: :competition_delegates
  has_many :competition_organizers, dependent: :delete_all
  has_many :organizers, through: :competition_organizers
  has_many :media, class_name: "CompetitionMedium", dependent: :delete_all
  has_many :tabs, -> { order(:display_order) }, dependent: :delete_all, class_name: "CompetitionTab"
  has_one :delegate_report, dependent: :destroy
  has_one :waiting_list, dependent: :destroy, as: :holder
  has_many :competition_venues, dependent: :destroy
  has_many :venue_countries, -> { distinct }, through: :competition_venues, source: :country
  has_many :venue_continents, -> { distinct }, through: :competition_venues, source: :continent
  belongs_to :country
  has_one :continent, through: :country
  has_many :championships, dependent: :delete_all
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :bookmarked_competitions, dependent: :delete_all
  has_many :bookmarked_users, through: :bookmarked_competitions, source: :user
  belongs_to :competition_series, optional: true
  has_many :series_competitions, -> { readonly }, through: :competition_series, source: :competitions
  has_many :series_registrations, -> { readonly }, through: :series_competitions, source: :registrations
  belongs_to :posting_user, optional: true, foreign_key: 'posting_by', class_name: "User"
  belongs_to :posted_user, optional: true, foreign_key: 'results_posted_by', class_name: "User"
  has_many :inbox_results, dependent: :delete_all
  has_many :inbox_persons, dependent: :delete_all
  has_many :inbox_scramble_sets, dependent: :delete_all
  has_many :matched_scramble_sets, through: :rounds
  belongs_to :announced_by_user, optional: true, foreign_key: "announced_by", class_name: "User"
  belongs_to :cancelled_by_user, optional: true, foreign_key: "cancelled_by", class_name: "User"
  has_many :competition_payment_integrations
  has_many :scramble_file_uploads, dependent: :delete_all
  has_many :accepted_registrations, -> { accepted }, class_name: "Registration", foreign_key: "competition_id"
  has_many :accepted_newcomers, -> { where(wca_id: nil) }, through: :accepted_registrations, source: :user
  has_many :duplicate_checker_job_runs, dependent: :delete_all
  has_one :tickets_competition_result
  has_one :result_ticket, through: :tickets_competition_result, source: :ticket

  accepts_nested_attributes_for :competition_events, allow_destroy: true
  accepts_nested_attributes_for :championships, allow_destroy: true
  accepts_nested_attributes_for :competition_series, allow_destroy: false

  validates :base_entry_fee_lowest_denomination, numericality: { greater_than_or_equal_to: 0, if: :entry_fee_required? }
  monetize :base_entry_fee_lowest_denomination,
           as: "base_entry_fee",
           allow_nil: true,
           with_model_currency: :currency_code

  validate :start_date, :cant_change_across_regulation_boundaries, if: -> { start_date_was.present? }

  private def cant_change_across_regulation_boundaries
    errors.add(:start_date, "You can't change the start date across Regulation boundaries.") if
      (start_date_was.year == 2025 && start_date.year == 2026) || (start_date_was.year == 2026 && start_date.year == 2025)
  end

  scope :not_cancelled, -> { where(cancelled_at: nil) }
  scope :visible, -> { where(show_at_all: true) }
  scope :not_visible, -> { where(show_at_all: false) }
  scope :over, -> { where("results_posted_at IS NOT NULL OR end_date < ?", Date.today) }
  scope :not_over, -> { where("results_posted_at IS NULL AND end_date >= ?", Date.today) }
  scope :upcoming, -> { where(results_posted_at: nil).where.not(start_date: ..Date.today) }
  scope :between_dates, ->(start_date, end_date) { where("start_date <= ? AND end_date >= ?", end_date, start_date) }
  scope :end_date_passed_since, ->(num_days) { where(end_date: ...(num_days.days.ago)) }
  scope :belongs_to_region, lambda { |region_id|
    joins(:country).where(
      "country_id = :region_id OR countries.continent_id = :region_id", region_id: region_id
    )
  }
  scope :contains, lambda { |search_term|
    where(
      "competitions.name like :search_term or
      competitions.city_name like :search_term",
      search_term: "%#{search_term}%",
    )
  }
  scope :has_event, lambda { |event_id|
    joins(
      "join competition_events ce#{event_id} ON ce#{event_id}.competition_id = competitions.id
      join events e#{event_id} ON e#{event_id}.id = ce#{event_id}.event_id",
    ).where("e#{event_id}.id = :event_id", event_id: event_id)
  }
  scope :managed_by, lambda { |user_id|
    joins("LEFT JOIN competition_organizers ON competition_organizers.competition_id = competitions.id")
      .joins("LEFT JOIN competition_delegates ON competition_delegates.competition_id = competitions.id")
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
  scope :results_posted, -> { where.not(results_posted_at: nil).where.not(results_posted_by: nil) }

  enum :guest_entry_status, {
    unclear: 0,
    free: 1,
    restricted: 2,
  }, prefix: true

  enum :competitor_can_cancel, %i[not_accepted always unpaid], prefix: true

  enum :auto_accept_preference, %i[disabled bulk live], prefix: true

  CLONEABLE_ATTRIBUTES = %w[
    city_name
    country_id
    information
    venue
    venue_address
    venue_details
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
    auto_close_threshold
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
    allow_registration_without_qualification
    refund_policy_percent
    guests_entry_fee_lowest_denomination
    guest_entry_status
    competitor_can_cancel
  ].freeze
  UNCLONEABLE_ATTRIBUTES = %w[
    id
    start_date
    end_date
    name
    name_reason
    cell_name
    show_at_all
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
    auto_accept_preference
    auto_accept_disable_threshold
    newcomer_month_reserved_spots
  ].freeze
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
  NEWCOMER_MONTH_ENABLED = false
  NEWCOMER_MONTH_RESERVATIONS_FRACTION = 0.5

  validates :competitor_limit_enabled, inclusion: { in: [true, false], if: :competitor_limit_required? }
  validates :competitor_limit, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_COMPETITOR_LIMIT, if: :competitor_limit_enabled? }
  validates :competitor_limit_reason, presence: true, if: :competitor_limit_enabled?
  validates :guests_enabled, acceptance: { accept: true, message: I18n.t('competitions.errors.must_ask_about_guests_if_specifying_limit') }, if: :guests_per_registration_limit_enabled?
  validates :guests_per_registration_limit, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_GUEST_LIMIT, allow_blank: true, if: :some_guests_allowed? }
  validates :events_per_registration_limit, absence: true, unless: :event_restrictions?
  validates :events_per_registration_limit, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: :number_of_events, allow_blank: true, if: :event_restrictions? }
  validates :guests_per_registration_limit, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: MAX_GUEST_LIMIT, allow_blank: true, if: :some_guests_allowed? }
  validates :events_per_registration_limit, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: :number_of_events, allow_blank: true, if: :event_restrictions? }
  validates :id, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: MAX_ID_LENGTH },
                 format: { with: VALID_ID_RE }, if: :name_valid_or_updating?
  private def name_valid_or_updating?
    self.persisted? || (name.length <= MAX_NAME_LENGTH && name =~ VALID_NAME_RE)
  end
  validates :name, length: { maximum: MAX_NAME_LENGTH },
                   format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }
  validates :cell_name, length: { maximum: MAX_CELL_NAME_LENGTH },
                        format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }, if: :name_valid_or_updating?
  strip_attributes only: %i[name cell_name], collapse_spaces: true, allow_empty: true
  validates :venue, format: { with: PATTERN_TEXT_WITH_LINKS_RE }
  validates :external_website, format: { with: URL_RE }, allow_blank: true
  validates :external_registration_page, presence: true, format: { with: URL_RE }, if: :external_registration_page_required?

  validates :country_id, inclusion: { in: Country::ALL_COUNTRY_IDS }
  validates :currency_code, inclusion: { in: Money::Currency, message: proc { I18n.t('competitions.errors.invalid_currency_code') } }

  validates :refund_policy_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100, if: :refund_policy_percent_required? }
  validates :refund_policy_limit_date, presence: true, if: :refund_policy_percent?
  validates :on_the_spot_registration, inclusion: { in: [true, false], if: :on_the_spot_registration_required? }
  validates :on_the_spot_entry_fee_lowest_denomination, numericality: { greater_than_or_equal_to: 0, if: :on_the_spot_entry_fee_required? }
  validates :allow_registration_edits, inclusion: { in: [true, false] }
  monetize :on_the_spot_entry_fee_lowest_denomination,
           as: "on_the_spot_base_entry_fee",
           allow_nil: true,
           with_model_currency: :currency_code
  validates :guests_entry_fee_lowest_denomination, numericality: { greater_than_or_equal_to: 0, if: :guests_entry_fee_required? }
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
  validates :main_event_id, inclusion: { in: ->(comp) { [nil].concat(comp.persisted_events_id) } }

  # Validations are used to show form errors to the user. If string columns aren't validated for length, it produces an unexplained error for the user
  validates :name, length: { maximum: MAX_NAME_LENGTH }
  validates :cell_name, length: { maximum: MAX_CELL_NAME_LENGTH }
  validates :city_name, length: { maximum: MAX_CITY_NAME_LENGTH }
  validates :venue, length: { maximum: MAX_VENUE_LENGTH }
  validates :venue_address, :venue_details, :name_reason, :forbid_newcomers_reason, length: { maximum: MAX_FREETEXT_LENGTH }
  validates :external_website, :external_registration_page, length: { maximum: MAX_URL_LENGTH }
  validates :contact, length: { maximum: MAX_MARKDOWN_LENGTH }

  validate :validate_newcomer_month_reserved_spots, if: -> { competitor_limit.present? && newcomer_month_reserved_spots.present? }
  private def validate_newcomer_month_reserved_spots
    max_newcomer_spots = (competitor_limit * NEWCOMER_MONTH_RESERVATIONS_FRACTION).floor
    errors.add(:newcomer_month_reserved_spots, I18n.t('competitions.errors.newcomer_month_reservations_percentage')) if
      newcomer_month_reserved_spots > max_newcomer_spots
    errors.add(:newcomer_month_reserved_spots, I18n.t('competitions.errors.newcomer_month_reservations_available')) if
      newcomer_month_reserved_spots > newcomer_month_spots_reservable
  end

  def enforce_newcomer_month_reservations?
    newcomer_month_reserved_spots.present? && newcomer_month_reserved_spots.positive? && NEWCOMER_MONTH_ENABLED
  end

  def newcomer_month_spots_reservable
    competitor_limit - (registrations.accepted_count - registrations.newcomer_month_eligible_competitors_count)
  end

  def newcomer_month_reserved_spots_remaining
    newcomer_month_reserved_spots - registrations.newcomer_month_eligible_competitors_count
  end

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
    some_guests_allowed? && guests_per_registration_limit.present?
  end

  def events_per_registration_limit_enabled?
    event_restrictions? && events_per_registration_limit.present?
  end

  def number_of_events
    persisted_events_id.length
  end

  NEARBY_DISTANCE_KM_WARNING = 250
  NEARBY_DISTANCE_KM_DANGER = 30
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

  validates :city_name, city: true

  # We have stricter validations for confirming a competition
  validates :city_name, :country_id, :venue, :venue_address, :latitude, :longitude, presence: true, if: :confirmed_or_visible?
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
    errors.add(:competition_events, I18n.t('competitions.errors.must_contain_event')) if no_events?
  end

  # We check for `present?` specifically so that a value of 0 will return true, and trigger the validation
  validate :auto_close_threshold_validations, if: -> { auto_close_threshold.present? }
  private def auto_close_threshold_validations
    errors.add(:auto_close_threshold, I18n.t('competitions.errors.auto_close_positive_nonzero')) unless auto_close_threshold.positive?
    return unless auto_close_threshold != 0

    errors.add(:auto_close_threshold, I18n.t('competitions.errors.use_wca_registration')) unless use_wca_registration
    errors.add(:auto_close_threshold, I18n.t('competitions.errors.must_exceed_competitor_limit')) if
      competitor_limit.present? && auto_close_threshold <= competitor_limit
    errors.add(:auto_close_threshold, I18n.t('competitions.errors.auto_close_exceed_paid')) if
      will_save_change_to_auto_close_threshold? && auto_close_threshold <= registrations.with_payments.count
  end

  # Only validate on update: nobody can confirm competition on creation.
  # The only exception to this is within tests, in which case we actually don't want to run this validation.
  validate :schedule_must_match_rounds, if: :confirmed_at_changed?, on: :update
  # Competitions after 2018-12-31 will have this check. All comps from 2019 onwards required a schedule.
  # Check added per "Support for cancelled competitions" and adding some old cancelled competitions to the website without a schedule.
  def schedule_must_match_rounds
    errors.add(:competition_events, I18n.t('competitions.errors.schedule_must_match_rounds')) if start_date.present? && start_date > Date.new(2018, 12, 31) && !(no_event_without_rounds? && schedule_includes_rounds?)
  end

  validate :advancement_condition_must_be_present_for_all_non_final_rounds, if: :confirmed_at_changed?, on: :update
  def advancement_condition_must_be_present_for_all_non_final_rounds
    errors.add(:competition_events, I18n.t('competitions.errors.advancement_condition_must_be_present_for_all_non_final_rounds')) unless rounds.all?(&:advancement_condition_is_valid?)
  end
  private def should_validate_registration_closing?
    confirmed_or_visible? && (will_save_change_to_registration_close? || will_save_change_to_confirmed_at?) && !closing_full_registration
  end

  # Same comment as for start_date_must_be_28_days_in_advance
  validate :registation_must_not_be_past, if: :should_validate_registration_closing?
  private def registation_must_not_be_past
    return unless editing_user_id

    editing_user = User.find(editing_user_id)
    errors.add(:registration_close, I18n.t('competitions.errors.registration_already_closed')) if !editing_user.can_admin_competitions? && registration_range_specified? && registration_past?
  end

  validate :auto_accept_validations
  private def auto_accept_validations
    errors.add(:auto_accept_preference, I18n.t('competitions.errors.must_use_wca_registration')) if
      !auto_accept_preference_disabled? && !use_wca_registration

    errors.add(:auto_accept_preference, I18n.t('competitions.errors.must_use_payment_integration')) if
      !auto_accept_preference_disabled? && confirmed_or_visible? && !probably_over? &&
      competition_payment_integrations.where(connected_account_type: "ConnectedStripeAccount").none?

    errors.add(:auto_accept_preference, I18n.t('competitions.errors.auto_accept_limit')) if
      auto_accept_disable_threshold.present? &&
      auto_accept_disable_threshold.positive? &&
      competitor_limit.present? &&
      auto_accept_disable_threshold >= competitor_limit

    errors.add(:auto_accept_preference, I18n.t('competitions.errors.auto_accept_not_negative')) if
      auto_accept_disable_threshold.present? && auto_accept_disable_threshold.negative?

    # TODO: This logic belongs in a controller more appropriately than in the validation.
    # IF we build a controller endpoint specifically for auto_accept, this logic should be move there.
    return unless auto_accept_preference_changed? && !auto_accept_preference_disabled?

    errors.add(:auto_accept_preference, I18n.t('competitions.errors.auto_accept_accept_paid_pending')) if registrations.pending.with_payments.any?
    errors.add(:auto_accept_preference, I18n.t('competitions.errors.auto_accept_accept_waitlisted')) if
      registrations.waitlisted.any? && !registration_full_and_accepted?
  end

  def no_event_without_rounds?
    competition_events.map(&:rounds).none?(&:empty?)
  end

  def schedule_includes_rounds?
    # We use activities instead of simply rounds, because for 333mbf and 333fm
    # we want to check all attempts are scheduled!
    expected_activity_codes = rounds.flat_map do |r|
      # Logic similar to "ActivitiesForRound"
      # from app/javascript/edit-schedule/SchedulesEditor/ActivityPicker.jsx
      if %w[333mbf 333fm].include?(r.event.id)
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

  def report_posted?
    delegate_report.posted?
  end

  def events_held?(desired_event_ids)
    # rubocop:disable Style/BitwisePredicate
    #   We have to shut up Rubocop here because otherwise it thinks that
    #   `desired_event_ids` are integers which are being compared to a bit mask
    (desired_event_ids & self.event_ids) == desired_event_ids
    # rubocop:enable Style/BitwisePredicate
  end

  def enforces_qualifications?
    uses_qualification? && !allow_registration_without_qualification
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
    errors.add(:staff_delegate_ids, I18n.t('competitions.errors.must_contain_delegate')) if staff_delegate_ids.empty?
  end

  validate :must_have_at_least_one_organizer, if: :confirmed_or_visible?
  def must_have_at_least_one_organizer
    errors.add(:organizer_ids, I18n.t('competitions.errors.must_contain_organizer')) if organizer_ids.empty?
  end

  def confirmed_or_visible?
    self.confirmed? || self.show_at_all?
  end

  def registration_full?
    competitor_count = registrations.accepted_and_paid_pending_count
    competitor_limit_enabled? && competitor_count >= competitor_limit
  end

  def registration_full_and_accepted?
    competitor_count = registrations.accepted_count
    competitor_limit_enabled? && competitor_count >= competitor_limit
  end

  def auto_accept_threshold_reached?
    return false if auto_accept_disable_threshold.blank?

    auto_accept_disable_threshold.positive? && auto_accept_disable_threshold <= registrations.competing_status_accepted.count
  end

  def number_of_bookmarks
    bookmarked_users.count
  end

  def country
    Country.c_find(self.country_id)
  end

  delegate :continent, to: :country

  def main_event_id=(event_id)
    super(event_id.presence)
  end

  # Enforce that the users marked as delegates for this competition are
  # actually delegates. Note: just because someone (legally) delegated a
  # competition in the past does not mean that they are still a delegate,
  # so we do not enforce this validation for past competitions.
  # See https://github.com/thewca/worldcubeassociation.org/issues/185#issuecomment-168402252
  # for a discussion about tracking delegate history so we could tighten up
  # this validation.
  validate :delegates_must_be_delegates, unless: :probably_over?
  def delegates_must_be_delegates
    return if self.delegates.all?(&:any_kind_of_delegate?)

    errors.add(:staff_delegate_ids, I18n.t('competitions.errors.not_all_delegates'))
    errors.add(:trainee_delegate_ids, I18n.t('competitions.errors.not_all_delegates'))
  end

  def user_should_post_delegate_report?(user)
    persisted? && probably_over? && !cancelled? && !delegate_report.posted? && delegates.include?(user)
  end

  def user_should_post_competition_results?(user)
    persisted? && probably_over? && !cancelled? && !self.results_submitted? && delegates.include?(user)
  end

  def warnings_for(user)
    warnings = {}

    if self.show_at_all?
      warnings[:announcement] = I18n.t('competitions.messages.not_announced') unless self.announced?

      if self.results.any? && !self.results_posted?
        warnings[:results] = if user&.can_admin_results?
                               I18n.t('competitions.messages.results_not_posted')
                             else
                               I18n.t('competitions.messages.results_still_processing')
                             end
      end
    else
      warnings[:invisible] = I18n.t('competitions.messages.not_visible')

      warnings[:name] = I18n.t('competitions.messages.name_too_long') if self.name.length > 32

      warnings[:id] = I18n.t('competitions.messages.id_starts_with_lowercase') unless /^[[:upper:]]|^\d/.match?(self.id)

      warnings[:events] = I18n.t('competitions.messages.must_have_events') if no_events?

      warnings[:waiting_list_deadline_missing] = I18n.t('competitions.messages.no_waiting_list_specified') unless self.waiting_list_deadline_date

      # NOTE: this will show up on the edit schedule page, and stay even if the
      # schedule matches when saved. Should we add some logic to not show this
      # message on the edit schedule page?
      warnings[:schedule] = I18n.t('competitions.messages.schedule_must_match_rounds') unless no_event_without_rounds? && schedule_includes_rounds?

      warnings[:advancement_conditions] = I18n.t('competitions.messages.advancement_condition_must_be_present_for_all_non_final_rounds') unless rounds.all?(&:advancement_condition_is_valid?)

      rounds.select(&:cutoff_is_greater_than_time_limit?).each do |round|
        warnings["cutoff_is_greater_than_time_limit#{round.id}"] = I18n.t('competitions.messages.cutoff_is_greater_than_time_limit', round_number: round.number, event: I18n.t("events.#{round.event.id}"))
      end

      rounds.select(&:cutoff_is_too_fast?).each do |round|
        warnings["cutoff_is_too_fast#{round.id}"] = I18n.t('competitions.messages.cutoff_is_too_fast', round_number: round.number, event: I18n.t("events.#{round.event.id}"))
      end

      rounds.select(&:cutoff_is_too_slow?).each do |round|
        warnings["cutoff_is_too_slow#{round.id}"] = I18n.t('competitions.messages.cutoff_is_too_slow', round_number: round.number, event: I18n.t("events.#{round.event.id}"))
      end

      rounds.select(&:time_limit_is_too_fast?).each do |round|
        warnings["time_limit_is_too_fast#{round.id}"] = I18n.t('competitions.messages.time_limit_is_too_fast', round_number: round.number, event: I18n.t("events.#{round.event.id}"))
      end

      rounds.select(&:time_limit_is_too_slow?).each do |round|
        warnings["time_limit_is_too_slow#{round.id}"] = I18n.t('competitions.messages.time_limit_is_too_slow', round_number: round.number, event: I18n.t("events.#{round.event.id}"))
      end

      warnings = championship_warnings.merge(warnings) if championship_warnings.any?

      warnings[:registration_payment_info] = I18n.t('competitions.messages.registration_payment_info') if paid_entry? && !competition_payment_integrations.exists?
    end

    warnings = reg_warnings.merge(warnings) if reg_warnings.any? && user&.can_manage_competition?(self)

    warnings
  end

  # @deprecated Fully transitioned to React. Keeping the method here because the test cases are interesting,
  #   and I want to "save" them until we can do proper React component testing (signed GB 2025-02-14)
  def registration_full_message
    if registration_full_and_accepted?
      I18n.t('registrations.registration_full', competitor_limit: competitor_limit)
    elsif registration_full?
      I18n.t('registrations.registration_full_include_waiting_list', competitor_limit: competitor_limit)
    end
  end

  def reg_warnings
    warnings = {}
    if registration_range_specified? && !registration_past?
      if self.announced?
        warnings[:regearly] = I18n.t('competitions.messages.reg_opens_too_early') if (self.registration_open - self.announced_at) < REGISTRATION_OPENING_EARLIEST
      elsif (self.registration_open - Time.now.utc) < REGISTRATION_OPENING_EARLIEST
        warnings[:regearly] = I18n.t('competitions.messages.reg_opens_too_early')
      end
    end
    warnings[:regclosed] = I18n.t('competitions.messages.registration_already_closed') if registration_range_specified? && registration_past? && !self.announced?

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

  def info_messages
    info = {}
    info[:upload_results] = I18n.t('competitions.messages.upload_results') if !self.results_posted? && self.probably_over? && !self.cancelled?
    if self.in_progress? && !self.cancelled?
      info[:in_progress] = if self.use_wca_live_for_scoretaking
                             I18n.t('competitions.messages.in_progress_at_wca_live_html', link_here: self.wca_live_link).html_safe
                           else
                             I18n.t('competitions.messages.in_progress', date: I18n.l(self.end_date, format: :long))
                           end
    end
    info
  end

  def user_can_pre_register?(user)
    # The user has to be either a registered Delegate or organizer of the competition
    delegates.include?(user) || trainee_delegates.include?(user) || organizers.include?(user)
  end

  def being_cloned_from
    @being_cloned_from ||= Competition.find_by(id: being_cloned_from_id)
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
             'series_registrations',
             'posting_user',
             'posted_user',
             'inbox_results',
             'inbox_persons',
             'inbox_scramble_sets',
             'matched_scramble_sets',
             'announced_by_user',
             'cancelled_by_user',
             'competition_payment_integrations',
             'venue_countries',
             'venue_continents',
             'waiting_list',
             'scramble_file_uploads',
             'accepted_registrations',
             'accepted_newcomers',
             'duplicate_checker_job_runs',
             'tickets_competition_result',
             'result_ticket'
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

  before_validation :compute_coordinates
  before_validation :create_id_and_cell_name
  before_validation :unpack_delegate_organizer_ids
  # After the cloned competition is created, clone other associations which cannot just be copied.
  after_create :clone_associations
  private def clone_associations
    # Clone competition tabs.
    return unless clone_tabs

    being_cloned_from&.tabs&.each do |tab|
      tabs.create!(tab.attributes.slice(*CompetitionTab::CLONEABLE_ATTRIBUTES))
    end
  end

  after_create :create_delegate_report!

  validate :dates_must_be_valid

  alias_attribute :visible, :show_at_all
  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude

  def create_id_and_cell_name(force_override: false)
    m = VALID_NAME_RE.match(name)
    return unless m

    name_without_year = m[1]
    year = m[2]
    if id.blank? || force_override
      # Generate competition id from name
      # By replacing accented chars with their ascii equivalents, and then
      # removing everything that isn't a digit or a character.
      safe_name_without_year = ActiveSupport::Inflector.transliterate(name_without_year, locale: :en).gsub(/[^a-z0-9]+/i, '')
      self.id = safe_name_without_year[0...(MAX_ID_LENGTH - year.length)] + year
    end
    return unless cell_name.blank? || force_override

    year = " #{year}"
    self.cell_name = name_without_year.truncate(MAX_CELL_NAME_LENGTH - year.length) + year
  end

  attr_writer :staff_delegate_ids, :organizer_ids, :trainee_delegate_ids

  def staff_delegate_ids
    @staff_delegate_ids || staff_delegates.map(&:id).join(",")
  end

  def organizer_ids
    @organizer_ids || organizers.map(&:id).join(",")
  end

  def trainee_delegate_ids
    @trainee_delegate_ids || trainee_delegates.map(&:id).join(",")
  end

  def should_render_register_v2?(user)
    user.cannot_register_for_competition_reasons(self).empty?
  end

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
      self.organizers = @organizer_ids.split(",").map { |id| User.find(id) } if @organizer_ids
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

  def dates_present?
    self.start_date.present? && self.end_date.present?
  end

  old_competition_events_attributes = instance_method(:competition_events_attributes=)
  define_method(:competition_events_attributes=) do |attributes|
    # This is also a mess. We "overload" the competition_events_attributes= method
    # so it won't be confused by the fact that our competition's id is changing.
    # See similar hack and comment in unpack_delegate_organizer_ids.
    with_old_id do
      old_competition_events_attributes.bind_call(self, attributes)
    end
  end

  # We only do this after_update, because upon adding/removing a manager to a
  # competition the attribute is automatically set to that manager's preference.
  after_update :update_receive_registration_emails
  after_update :clean_series_when_leaving
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

  def report_posted_by_user
    delegate_report&.posted_by_user_id
  end

  # This callback updates all tables having the competition id, when the id changes.
  # This should be deleted after competition id is made immutable: https://github.com/thewca/worldcubeassociation.org/pull/381
  after_save :update_foreign_keys, if: :saved_change_to_id?
  def update_foreign_keys
    Competition.reflect_on_all_associations.uniq(&:klass).each do |association_reflection|
      foreign_key = association_reflection.foreign_key
      association_reflection.klass.where(foreign_key => id_before_last_save).update_all(foreign_key => id) if %w[competition_id competitionId].include?(foreign_key)
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

  attr_accessor :closing_full_registration, :being_cloned_from_id, :clone_tabs, :editing_user_id

  validate :user_cannot_demote_themself
  def user_cannot_demote_themself
    return unless editing_user_id

    editing_user = User.find(editing_user_id)
    return if editing_user.can_manage_competition?(self)

    errors.add(:staff_delegate_ids, "You cannot demote yourself")
    errors.add(:trainee_delegate_ids, "You cannot demote yourself")
    errors.add(:organizer_ids, "You cannot demote yourself")
  end

  validate :organizers_can_organize_competition
  private def organizers_can_organize_competition
    organizers.each do |organizer|
      errors.add(:organizer_ids, "#{organizer.name}: #{organizer.cannot_organize_competition_reasons.to_sentence}") if organizer&.cannot_organize_competition_reasons.present?
    end
  end

  validate :registration_must_close_after_it_opens
  def registration_must_close_after_it_opens
    errors.add(:registration_close, I18n.t('competitions.errors.registration_close_after_open')) if registration_open && registration_close && registration_open >= registration_close
  end

  attr_reader :receive_registration_emails

  def receive_registration_emails=(registration)
    @receive_registration_emails = ActiveRecord::Type::Boolean.new.cast(registration)
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
    competition_delegate = competition_delegates.find_by(delegate_id: user_id)
    return true if competition_delegate&.receive_registration_emails

    competition_organizer = competition_organizers.find_by(organizer_id: user_id)
    return true if competition_organizer&.receive_registration_emails

    false
  end

  def can_receive_registration_emails?(user_id)
    competition_delegate = competition_delegates.find_by(delegate_id: user_id)
    return true if competition_delegate

    competition_organizer = competition_organizers.find_by(organizer_id: user_id)
    return true if competition_organizer

    false
  end

  def update_receive_registration_emails
    return unless editing_user_id && !@receive_registration_emails.nil?

    competition_delegate = competition_delegates.find_by(delegate_id: editing_user_id)
    competition_delegate&.update_attribute(:receive_registration_emails, @receive_registration_emails)
    competition_organizer = competition_organizers.find_by(organizer_id: editing_user_id)
    competition_organizer&.update_attribute(:receive_registration_emails, @receive_registration_emails)
  end

  def using_payment_integrations?
    competition_payment_integrations.any? && paid_entry?
  end

  def can_edit_registration_fees?
    # Quick workaround for https://github.com/thewca/worldcubeassociation.org/issues/2123
    # (We used to return `registrations.with_payments.empty?` here)
    true
  end

  def after_registration_open?
    !registration_not_yet_opened?
  end

  def registration_currently_open?
    use_wca_registration? && !cancelled? && after_registration_open? && !registration_past?
  end

  def registration_not_yet_opened?
    registration_open && Time.now < registration_open
  end

  def registration_past?
    registration_close && registration_close < Time.now
  end

  def can_show_competitors_page?
    organizer_delegate_ids = organizers.pluck(:id) + delegates.pluck(:id)
    normal_competitor_ids = registrations.competing_status_accepted.competing.pluck(:user_id) - organizer_delegate_ids
    after_registration_open? || normal_competitor_ids.any?
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
    self.registrations.any?
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
    TZInfo::Country.get(country.iso2.upcase).zone_identifiers
  rescue TZInfo::InvalidCountryCode
    # This can occur for non real country *and* XK!
    # FIXME what to provide for XA, XE, XM, XS?
    ["Europe/London"]
  end

  private def compute_coordinates
    self.latitude_microdegrees = @latitude_degrees * 1e6 unless @latitude_degrees.nil?
    self.longitude_microdegrees = @longitude_degrees * 1e6 unless @longitude_degrees.nil?
  end

  delegate :nonzero?, to: :base_entry_fee, prefix: true

  def paid_entry?
    if base_entry_fee_lowest_denomination.nil?
      competition_events.sum(:fee_lowest_denomination).positive?
    else
      (base_entry_fee_lowest_denomination + competition_events.sum(:fee_lowest_denomination)).positive?
    end
  end

  def external_registration_page_required?
    confirmed? && !use_wca_registration && created_at.present? && created_at > Date.new(2018, 12, 31)
  end

  def any_rounds?
    rounds.any?
  end

  def any_venues?
    competition_venues.any?
  end

  def entry_fee_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 7, 17) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
  end

  def competitor_limit_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 9, 1)
  end

  def on_the_spot_registration_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22)
  end

  def on_the_spot_entry_fee_required?
    on_the_spot_registration? &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
  end

  def refund_policy_percent_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
  end

  def guests_entry_fee_required?
    confirmed? && created_at.present? && created_at > Date.new(2018, 8, 22) &&

      # The different venues may have different entry fees. It's better for
      # people to leave this blank than to set an incorrect value here.
      country.present? && !country.multiple_countries?
  end

  def all_guests_allowed?
    guest_entry_status_free?
  end

  def some_guests_allowed?
    guest_entry_status_restricted?
  end

  def pending_competitors_count
    registrations.pending.count
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
  def event_change_deadline_date_required?
    start_date.present? && start_date > Date.new(2021, 6, 24)
  end

  # can registration edits be done right now
  # must be allowed in general, and if the deadline field exists, is it a date and in the future
  def registration_edits_currently_permitted?
    !started? && self.allow_registration_edits &&
      (!event_change_deadline_date_required? || event_change_deadline_date.blank? || event_change_deadline_date > DateTime.now)
  end

  private def dates_must_be_valid
    if start_date.nil? && end_date.nil?
      if confirmed_or_visible?
        errors.add(:start_date, I18n.t('common.errors.invalid'))
        errors.add(:end_date, I18n.t('common.errors.invalid'))
      end
      return
    end

    return errors.add(:start_date, I18n.t('common.errors.invalid')) if start_date.blank?
    return errors.add(:end_date, I18n.t('common.errors.invalid')) if end_date.blank?

    errors.add(:end_date, I18n.t('competitions.errors.end_date_before_start')) if end_date < start_date

    errors.add(:end_date, I18n.t('competitions.errors.span_too_many_days', max_days: MAX_SPAN_DAYS)) if number_of_days > MAX_SPAN_DAYS
  end

  validate :registration_dates_must_be_valid, if: :start_date?
  private def registration_dates_must_be_valid
    errors.add(:refund_policy_limit_date, I18n.t('competitions.errors.refund_date_after_start')) if refund_policy_limit_date? && refund_policy_limit_date > start_date

    return unless registration_period_required? && [registration_open, registration_close].all?(&:present?)

    errors.add(:registration_close, I18n.t('competitions.errors.registration_period_after_start')) if
      registration_open >= start_date || registration_close >= start_date
  end

  validate :waiting_list_dates_must_be_valid
  private def waiting_list_dates_must_be_valid
    return unless waiting_list_deadline_date?

    errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_before_registration_close')) if registration_range_specified? && waiting_list_deadline_date < registration_close
    errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_before_refund_date')) if refund_policy_limit_date? && waiting_list_deadline_date < refund_policy_limit_date
    errors.add(:waiting_list_deadline_date, I18n.t('competitions.errors.waiting_list_deadline_after_end')) if waiting_list_deadline_date > end_date
  end

  validate :event_change_dates_must_be_valid
  private def event_change_dates_must_be_valid
    return unless event_change_deadline_date?

    errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_before_registration_close')) if registration_range_specified? && event_change_deadline_date < registration_close
    errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_with_ots')) if on_the_spot_registration? && event_change_deadline_date < start_date
    errors.add(:event_change_deadline_date, I18n.t('competitions.errors.event_change_deadline_after_end_date')) if event_change_deadline_date > end_date.to_datetime.end_of_day
  end

  def enabling_on_the_spot_registration?
    self.on_the_spot_registration_changed? && self.on_the_spot_registration?
  end

  validate :enforce_edit_deadline_ots_consistency
  private def enforce_edit_deadline_ots_consistency
    errors.add(:on_the_spot_registration, I18n.t('competitions.errors.on_the_spot_with_past_event_change_deadline')) if enabling_on_the_spot_registration? && event_change_deadline_date&.past?
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
  def kilometers_to(competition)
    6371 *
      Math.sqrt(
        (((competition.longitude_radians - longitude_radians) * Math.cos((competition.latitude_radians + latitude_radians) / 2))**2) +
        ((competition.latitude_radians - latitude_radians)**2),
      )
  end

  def registration_start_date_present?
    registration_open.present?
  end

  # The division is to convert the end result from secods to days. .to_date removed some hours from the subtraction
  def days_until
    start_date ? ((start_date.to_time(:utc) - Time.now.utc) / 86_400).to_i : nil
  end

  def time_until_registration
    registration_open ? ApplicationController.helpers.distance_of_time_in_words_to_now(registration_open) : nil
  end

  def date_range
    ApplicationController.helpers.wca_date_range(self.start_date, self.end_date)
  end

  # The competition must be at least 28 days in advance in order to confirm it. Admins are able to modify the competition despite being less than 28 days in advance.
  # We only run this validation if we're actually changing the start_date or
  # confirming the competition, to not prevent organizers/delegates from
  # updating competition-specific setttings, such as the receive notifications checkbox.
  validate :start_date_must_be_28_days_in_advance, if: :should_validate_start_date?
  def start_date_must_be_28_days_in_advance
    return unless editing_user_id

    editing_user = User.find(editing_user_id)
    errors.add(:start_date, I18n.t('competitions.errors.start_date_must_be_28_days_in_advance')) if !editing_user.can_admin_competitions? && start_date && days_until < MUST_BE_ANNOUNCED_GTE_THIS_MANY_DAYS
  end

  def should_validate_start_date?
    confirmed_or_visible? && (will_save_change_to_start_date? || will_save_change_to_confirmed_at?)
  end

  def days_until_competition?(competition)
    return false if !competition.dates_present? || !self.dates_present?

    days_until = (competition.start_date - self.end_date).to_i
    days_until = (self.start_date - competition.end_date).to_i * -1 if days_until.negative?
    days_until
  end

  def dangerously_close_to?(competition)
    self.adjacent_to?(competition, NEARBY_DISTANCE_KM_DANGER, NEARBY_DAYS_DANGER)
  end

  def adjacent_to?(competition, distance_km, distance_days)
    self.distance_adjacent_to?(competition, distance_km) && self.start_date_adjacent_to?(competition, distance_days)
  end

  def start_date_adjacent_to?(competition, distance_days)
    return false if !competition.dates_present? || !self.dates_present?

    self.days_until_competition?(competition).abs < distance_days
  end

  def distance_adjacent_to?(competition, distance_km)
    self.kilometers_to(competition) < distance_km
  end

  def registration_open_adjacent_to?(competition, distance_minutes)
    return false if !competition.registration_start_date_present? || !self.registration_start_date_present?

    self.minutes_until_other_registration_starts(competition).abs < distance_minutes
  end

  def minutes_until_other_registration_starts(competition)
    return false if !competition.registration_start_date_present? || !self.registration_start_date_present?

    seconds_until = (competition.registration_open - self.registration_open).to_i
    seconds_until = (self.registration_open - competition.registration_open).to_i * -1 if seconds_until.negative?
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
    data = short ? cell_name : name
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

  alias_method :confirmed, :confirmed?

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
    self.show_at_all? || user&.can_manage_competition?(self)
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
  def probably_over?
    !end_date.nil? && end_date < Date.today
  end

  def upcoming?
    !results_posted? && (start_date.nil? || start_date > Date.today)
  end

  def city_and_country
    [city_name, country&.name].compact.join(', ')
  end

  def events_with_podium_results
    results.podium.order(:pos).group_by(&:event)
           .sort_by { |event, _results| event.rank }
  end

  def winning_results
    results.winners
  end

  def person_ids_with_results
    results.group_by(&:person_id)
           .sort_by { |_person_id, results| results.first.person_name }
           .map do |person_id, results|
      results.sort_by! { |r| [r.event.rank, -r.round_type.rank] }
      [person_id, results.sort_by { |r| [r.event.rank, -r.round_type.rank] }]
    end
  end

  def events_with_round_types_with_results
    results.group_by(&:event)
           .sort_by { |event, _results| event.rank }
           .map do |event, results_for_event|
             round_types_with_results = results_for_event
                                        .group_by(&:round_type)
                                        .sort_by { |format, _results| format.rank }.reverse
                                        .map { |round_type, results| [round_type, results.sort_by { |r| [r.pos, r.person_name] }] }

             [event, round_types_with_results]
           end
  end

  def ineligible_events(user)
    competition_events.reject { |ce| ce.can_register?(user) }.map(&:event)
  end

  def started?
    start_date.present? && start_date <= Date.today
  end

  def organizers_or_delegates
    self.organizers.empty? ? self.delegates : self.organizers
  end

  SortedRanking = Struct.new(
    :name,
    :user_id,
    :wca_id,
    :country_id,
    :country_iso2,
    :average_best,
    :average_rank,
    :single_best,
    :single_rank,
    :tied_previous,
    :pos,
    keyword_init: true,
  )

  # rubocop:disable Lint/StructNewOverride
  # this does overwrite sort_by because the frontend relies on the field, but as it's never used in an array, it should be fine
  PsychSheet = Struct.new(
    :sorted_rankings,
    :sort_by,
    :sort_by_second,
    keyword_init: true,
  )
  # rubocop:enable Lint/StructNewOverride

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

      registered_user_ids = self.registrations
                                .accepted
                                .includes(:registration_competition_events)
                                .where(registration_competition_events: { competition_event: competition_event })
                                .pluck(:user_id)

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
        User.eager_load(:ranks_single, :ranks_average)
            .select(:name, :wca_id, :country_iso2)
            .find(registered_user_ids)
      end

      rank_symbol = :"ranks_#{sort_by}"
      second_rank_symbol = :"ranks_#{sort_by_second}"

      sorted_users = users_with_rankings.sort_by do |user|
        # using '.find_by(event: ...)' fires another SQL query *despite* the ranks being pre-loaded :facepalm:
        rank = user.send(rank_symbol).find { |r| r.event == event }
        second_rank = user.send(second_rank_symbol).find { |r| r.event == event }

        [
          # Competitors with ranks should appear first in the sorting,
          # competitors without ranks should appear last. That's why they get a higher number if rank is not present.
          rank.present? ? 0 : 1,
          rank&.world_rank || 0,
          second_rank.present? ? 0 : 1,
          second_rank&.world_rank || 0,
          user.name,
        ]
      end

      prev_sorted_ranking = nil

      sorted_rankings = sorted_users.map.with_index do |user, i|
        # see comment about .find vs .find_by above.
        single_ranking = user.ranks_single.find { |r| r.event == event }
        average_ranking = user.ranks_average.find { |r| r.event == event }

        sort_by_ranking = sort_by == 'single' ? single_ranking : average_ranking

        if sort_by_ranking.present?
          # Change position to previous if both single and average are tied with previous registration.
          average_tied_previous = average_ranking&.world_rank == prev_sorted_ranking&.average_rank
          single_tied_previous = single_ranking&.world_rank == prev_sorted_ranking&.single_rank

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
          country_id: user.country&.id,
          country_iso2: user.country_iso2,
          average_rank: average_ranking&.world_rank,
          average_best: average_ranking&.best || 0,
          single_rank: single_ranking&.world_rank,
          single_best: single_ranking&.best || 0,
          tied_previous: tied_previous,
          pos: pos,
        )

        prev_sorted_ranking = sorted_ranking
      end

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
      competition_events.find_by(event_id: event.id) || competition_events.build(event_id: event.id)
    end
  end

  def self.years
    Competition.where(show_at_all: true).pluck(:start_date).map(&:year).uniq.sort!.reverse!
  end

  def self.non_future_years
    self.years.select { |y| y <= Date.today.year }
  end

  def self.search(query, params: {}, managed_by_user: nil)
    competitions = if managed_by_user
                     Competition.managed_by(managed_by_user.id)
                   else
                     Competition.visible
                   end

    if params[:include_cancelled].present?
      include_cancelled = ActiveRecord::Type::Boolean.new.cast(params[:include_cancelled])
      competitions = competitions.not_cancelled unless include_cancelled
    end

    if params[:continent].present?
      continent = Continent.find(params[:continent])
      raise WcaExceptions::BadApiParameter.new("Invalid continent: '#{params[:continent]}'") unless continent

      competitions = competitions.joins(:country)
                                 .where(country: { continent: continent })
    end

    if params[:country_iso2].present?
      country = Country.find_by(iso2: params[:country_iso2])
      raise WcaExceptions::BadApiParameter.new("Invalid country_iso2: '#{params[:country_iso2]}'") unless country

      competitions = competitions.where(country_id: country.id)
    end

    if params[:delegate].present?
      delegate_user = User.find_by(wca_id: params[:delegate]) || User.find(params[:delegate])
      raise WcaExceptions::BadApiParameter.new("Invalid delegate: '#{params[:delegate]}'") if !delegate_user || !delegate_user.delegate_status

      competitions = competitions.left_outer_joins(:delegates)
                                 .where(competition_delegates: { delegate_id: delegate_user.id })
    end

    if params[:event_ids].present?
      event_ids = params[:event_ids].presence
      raise WcaExceptions::BadApiParameter.new("Invalid event IDs: '#{params[:event_ids]}'") unless event_ids.is_a?(Array)

      event_ids.each do |event_id|
        # This looks completely crazy (why not just pass the array as a whole, to build a `WHERE event_id IN (...)`??)
        #   but is actually necessary to make sure that the competition holds ALL of the required events
        #   and not just one or more (ie any) of the requested events.
        competitions = competitions.has_event(event_id)
      end
    end

    if params[:start].present?
      start_date = Date.safe_parse(params[:start])
      raise WcaExceptions::BadApiParameter.new("Invalid start: '#{params[:start]}'") unless start_date

      competitions = competitions.where(start_date: start_date..)
    end

    if params[:end].present?
      end_date = Date.safe_parse(params[:end])
      raise WcaExceptions::BadApiParameter.new("Invalid end: '#{params[:end]}'") unless end_date

      competitions = competitions.where(end_date: ..end_date)
    end

    if params[:ongoing_and_future].present?
      target_date = Date.safe_parse(params[:ongoing_and_future])
      raise WcaExceptions::BadApiParameter.new("Invalid ongoing_and_future: '#{params[:ongoing_and_future]}'") unless target_date

      competitions = competitions.where(end_date: target_date..)
    end

    if params[:announced_after].present?
      announced_date = Date.safe_parse(params[:announced_after])
      raise WcaExceptions::BadApiParameter.new("Invalid announced date: '#{params[:announced_after]}'") unless announced_date

      competitions = competitions.where("announced_at > ?", announced_date)
    end

    if params[:admin_status].present?
      admin_status = params[:admin_status].to_s

      raise WcaExceptions::BadApiParameter.new("Invalid admin status: '#{params[:admin_status]}'") unless %w[danger warning].include?(admin_status)

      num_days = {
        warning: Competition::REPORT_AND_RESULTS_DAYS_WARNING,
        danger: Competition::REPORT_AND_RESULTS_DAYS_DANGER,
      }[admin_status.to_sym]

      competitions = competitions.end_date_passed_since(num_days).pending_report_or_results_posting
    end

    query&.split&.each do |part|
      like_query = %w[id name cell_name city_name country_id].map { |column| "competitions.#{column} LIKE :part" }.join(" OR ")
      competitions = competitions.where(like_query, part: "%#{part}%")
    end

    orderable_fields = %i[name start_date end_date announced_at]
    order = if params[:sort]
              params[:sort].split(',')
                           .map do |part|
                reverse, field = part.match(/^(-)?(\w+)$/).captures
                [field.to_sym, reverse ? :desc : :asc]
              end
                                   # rubocop:disable Style/HashSlice
                                   #   RuboCop suggests using `slice` here, which is a noble intention but breaks the order
                                   #   of sort arguments. However, this order is crucial (sorting by "name then start_date"
                                   #   is different from sorting by "start_date then name") so we insist on doing it our way.
                                   .select { |field, _| orderable_fields.include?(field) }
                           # rubocop:enable Style/HashSlice
                           .to_h
            else
              { start_date: :desc }
            end

    # Respect other `includes` associations that might have been specified ahead of time
    previous_includes = competitions.includes_values

    competitions.includes(:delegates, :organizers, *previous_includes).order(**order)
  end

  def competing_step_parameters(current_user)
    competition_params = serializable_hash(only: %i[events_per_registration_limit
                                                    allow_registration_edits
                                                    guest_entry_status
                                                    guests_per_registration_limit
                                                    guests_enabled
                                                    uses_qualification?
                                                    allow_registration_without_qualification
                                                    force_comment_in_registration],
                                           methods: %i[qualification_wcif event_ids],
                                           include: [])
    user_params = {
      preferredEvents: current_user.preferred_events.pluck(:id),
      personalRecords: {
        single: current_user.ranks_single&.map(&:to_wcif) || [],
        average: current_user.ranks_average&.map(&:to_wcif) || [],
      },
    }
    competition_params.merge(user_params)
  end

  def payment_step_parameters
    # Currently hardcoded to support stripe only
    {
      stripePublishableKey: AppSecrets.STRIPE_PUBLISHABLE_KEY,
      connectedAccountId: payment_account_for(:stripe)&.account_id,
    }
  end

  def available_registration_lanes(current_user)
    # There is currently only one lane, so this always returns the competitor lane
    steps = []
    steps << { key: 'requirements', isEditable: false }
    steps << { key: 'competing', parameters: competing_step_parameters(current_user), isEditable: true }
    steps << { key: 'payment', parameters: payment_step_parameters, isEditable: true, deadline: self.registration_close } if using_payment_integrations?

    steps
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
      "shortName" => cell_name,
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
               base_entry_fee_lowest_denomination currency_code allow_registration_edits competitor_can_cancel
               allow_registration_without_qualification refund_policy_percent use_wca_registration guests_per_registration_limit venue contact
               force_comment_in_registration use_wca_registration external_registration_page guests_entry_fee_lowest_denomination guest_entry_status
               information events_per_registration_limit guests_enabled auto_accept_preference auto_accept_disable_threshold],
      # TODO: h2h_rounds is a temporary method, which should be removed when full-fledged H2H backend support is added - expected in Q1 2026
      methods: %w[url website short_name city venue_address venue_details latitude_degrees longitude_degrees country_iso2 event_ids
                  main_event_id number_of_bookmarks using_payment_integrations? uses_qualification? uses_cutoff? competition_series_ids registration_full?
                  part_of_competition_series? registration_full_and_accepted? h2h_rounds],
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

  def other_series_ids
    series_sibling_competitions.ids
  end

  def qualification_wcif
    return {} unless uses_qualification?

    competition_events
      .where.not(qualification: nil)
      .index_by(&:event_id)
      .transform_values(&:qualification)
      .transform_values(&:to_wcif)
  end

  def persons_wcif(authorized: false)
    managers = self.managers
    includes_associations = [
      { assignments: [:schedule_activity] },
      { user: {
        current_avatar: [],
        person: %i[ranks_single ranks_average],
      } },
      :wcif_extensions,
      :events,
    ]

    # NOTE: we're including non-competing registrations so that they can have job
    # assignments as well. These registrations don't have accepted?, but they
    # should appear in the WCIF.
    persons_wcif = self.registrations
                       .includes(includes_associations)
                       .select { authorized || it.wcif_status == "accepted" }
                       .map do |registration|
      managers.delete(registration.user)
      registration.user.to_wcif(self, registration, authorized: authorized)
    end
    # NOTE: unregistered managers may generate N+1 queries on their personal bests,
    # but that's fine because there are very few of them!
    persons_wcif + managers.map { it.to_wcif(self, authorized: authorized) }
  end

  def events_wcif
    includes_associations = [
      { rounds: %i[competition_event wcif_extensions] },
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
          { schedule_activities: [{ child_activities: %i[child_activities wcif_extensions] }, :wcif_extensions] },
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
      set_wcif_schedule!(wcif["schedule"]) if wcif["schedule"]
      update_persons_wcif!(wcif["persons"]) if wcif["persons"]
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

    raise WcaExceptions::BadApiParameter.new("Cannot edit the competitor limit because the competition has been confirmed by WCAT") if confirmed? && !current_user.can_admin_competitions?

    raise WcaExceptions::BadApiParameter.new("Cannot update the competitor limit because competitor limits are not enabled for this competition") unless competitor_limit_enabled?

    raise WcaExceptions::BadApiParameter.new("Cannot remove competitor limit") if wcif_competitor_limit.blank?

    self.competitor_limit = wcif_competitor_limit
  end

  def set_wcif_series!(wcif_series, current_user)
    raise WcaExceptions::BadApiParameter.new("Cannot change Competition Series") unless current_user.can_update_competition_series?(self)

    raise WcaExceptions::BadApiParameter.new("The Series must include the competition you're currently editing.") unless wcif_series["competitionIds"].include?(self.id)

    competition_series = CompetitionSeries.find_by(wcif_id: wcif_series["id"]) || CompetitionSeries.new
    competition_series.set_wcif!(wcif_series)

    self.competition_series = competition_series
  end

  def set_wcif_events!(wcif_events, current_user)
    # Remove extra events.
    competition_events_includes_assotiations = [
      { rounds: %i[competition_event wcif_extensions] },
      :wcif_extensions,
    ]
    self.competition_events.includes(competition_events_includes_assotiations).find_each do |competition_event|
      wcif_event = wcif_events.find { |e| e["id"] == competition_event.event.id }
      event_to_be_removed = !wcif_event || !wcif_event["rounds"]
      if event_to_be_removed
        raise WcaExceptions::BadApiParameter.new("Cannot remove events") unless current_user.can_add_and_remove_events?(self)

        competition_event.destroy!
      end
    end

    # Create missing events.
    wcif_events.each do |wcif_event|
      event_found = competition_events.find { |ce| ce.event_id == wcif_event["id"] }
      event_to_be_added = wcif_event["rounds"]
      next unless !event_found && event_to_be_added
      raise WcaExceptions::BadApiParameter.new("Cannot add events") unless current_user.can_add_and_remove_events?(self)

      competition_events.create!(event_id: wcif_event["id"])
    end

    # Update all events.
    wcif_events.each do |wcif_event| # rubocop:disable Style/CombinableLoops
      event_to_be_updated = wcif_event["rounds"]
      next unless event_to_be_updated
      raise WcaExceptions::BadApiParameter.new("Cannot update events") unless current_user.can_update_events?(self)

      competition_events.find { |ce| ce.event_id == wcif_event["id"] }.load_wcif!(wcif_event)
    end

    reload
  end

  # Takes an array of partial Person WCIF and updates the fields that are not immutable.
  def update_persons_wcif!(wcif_persons)
    registration_includes = [
      { assignments: [:schedule_activity] },
      :user,
      :wcif_extensions,
      :registration_competition_events,
    ]
    registrations = self.registrations.includes(registration_includes)
    competition_activities = all_activities
    new_assignments = []
    removed_assignments = []
    wcif_persons.each do |wcif_person|
      local_assignments = []
      registration = registrations.find { |reg| reg.user_id == wcif_person["wcaUserId"] }
      # If no registration is found, and the Registration is marked as non-competing, add this person as a non-competing staff member.
      adding_non_competing = wcif_person["registration"].present? && wcif_person["registration"]["isCompeting"] == false
      if adding_non_competing
        registration ||= registrations.create!(
          competition: self,
          user_id: wcif_person["wcaUserId"],
          is_competing: false,
        )
      end
      next if registration.blank?

      WcifExtension.update_wcif_extensions!(registration, wcif_person["extensions"]) if wcif_person["extensions"]
      # NOTE: person doesn't necessarily have corresponding registration (e.g. registratinless organizer/delegate).
      if wcif_person["roles"]
        roles = wcif_person["roles"] - %w[delegate trainee-delegate organizer] # These three are added on the fly.
        # The additional roles are only for WCIF purposes and we don't validate them,
        # so we can safely skip validations by using update_attribute
        registration.update_attribute(:roles, roles)
      end
      wcif_person["assignments"]&.each do |assignment_wcif|
        schedule_activity = competition_activities.find do |competition_activity|
          competition_activity.wcif_id == assignment_wcif["activityId"]
        end
        raise WcaExceptions::BadApiParameter.new("Cannot create assignment for non-existent activity with id #{assignment_wcif['activityId']}") unless schedule_activity

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
        raise WcaExceptions::BadApiParameter.new("Invalid assignment: #{a.errors.map(&:full_message)} for #{assignment_wcif}") unless assignment.valid?

        local_assignments << assignment
      end
      new_assignments.concat(local_assignments.map(&:attributes))
      removed_assignments.concat(registration.assignments.ids - local_assignments.map(&:id))
    end
    Assignment.where(id: removed_assignments).delete_all if removed_assignments.any?
    Assignment.upsert_all(new_assignments) if new_assignments.any?
  end

  def set_wcif_schedule!(wcif_schedule)
    if wcif_schedule["startDate"] != start_date.strftime("%F")
      raise WcaExceptions::BadApiParameter.new("Wrong start date for competition")
    elsif wcif_schedule["numberOfDays"] != number_of_days
      raise WcaExceptions::BadApiParameter.new("Wrong number of days for competition")
    end

    competition_venues = self.competition_venues.includes [
      {
        venue_rooms: [
          :wcif_extensions,
          {
            schedule_activities: [{ child_activities: %i[child_activities wcif_extensions] }, :wcif_extensions],
            competition: { competition_events: :rounds },
          },
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
        "competitorLimit" => { "type" => %w[integer null] },
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

  alias_attribute :short_name, :cell_name
  alias_attribute :city, :city_name

  def country_iso2
    country&.iso2
  end

  def url
    Rails.application.routes.url_helpers.competition_url(self, host: EnvConfig.ROOT_URL)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id name website start_date end_date
             registration_open registration_close announced_at
             cancelled_at results_posted_at competitor_limit venue],
    methods: %w[url website short_name short_display_name city
                venue_address venue_details latitude_degrees longitude_degrees
                country_iso2 event_ids time_until_registration date_range],
    include: %w[delegates organizers],
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
    all_activities.each do |activity|
      event = Icalendar::Event.new
      event.dtstart = Icalendar::Values::DateTime.new(activity.start_time, "TZID" => "Etc/UTC")
      event.dtend = Icalendar::Values::DateTime.new(activity.end_time, "TZID" => "Etc/UTC")
      event.summary = activity.localized_name
      cal.add_event(event)
    end
    cal.publish
    cal
  end

  def world_or_continental_championship?
    championship_types.any? { |ct| Championship::MAJOR_CHAMPIONSHIP_TYPES.include?(ct) }
  end

  def any_championship?
    championship_types.any?
  end

  alias_method :competition_is_championship, :any_championship?

  def championship_types
    championships.pluck(:championship_type)
  end

  def multi_country_fmc_competition?
    events.length == 1 && events[0].fewest_moves? && Country::FICTIVE_IDS.include?(country_id)
  end

  def exempt_from_wca_dues?
    world_or_continental_championship? || multi_country_fmc_competition?
  end

  validate :series_siblings_must_be_valid
  private def series_siblings_must_be_valid
    return unless part_of_competition_series?

    series_sibling_competitions.each do |comp|
      errors.add(:competition_series, I18n.t('competitions.errors.series_distance_km', competition: comp.name)) unless self.distance_adjacent_to?(comp, CompetitionSeries::MAX_SERIES_DISTANCE_KM)
      errors.add(:competition_series, I18n.t('competitions.errors.series_distance_days', competition: comp.name)) unless self.start_date_adjacent_to?(comp, CompetitionSeries::MAX_SERIES_DISTANCE_DAYS)
    end
  end

  private def clean_series_when_leaving
    if competition_series_id.nil? && # if we just processed an update to remove the competition series
       (old_series_id = competition_series_id_previously_was) && # and we previously had an ID
       (old_series = CompetitionSeries.find_by(id: old_series_id)) # and that series still exists
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

  def series_sibling_registrations
    return [] unless part_of_competition_series?

    series_registrations
      .where.not(competition: self)
  end

  def export_for_dues_generation
    error = DuesCalculator.error_in_dues_calculation(self.country_iso2, self.currency_code)
    dues_per_competitor_in_usd = error.nil? ? DuesCalculator.dues_per_competitor_in_usd(self.country_iso2, self.base_entry_fee_lowest_denomination.to_i, self.currency_code) : 0

    [
      id, name, country.iso2, continent.id,
      start_date, end_date, announced_at, results_posted_at,
      Rails.application.routes.url_helpers.competition_url(id), num_competitors, delegates.reject(&:trainee_delegate?).map(&:name).sort.join(","),
      currency_code, base_entry_fee_lowest_denomination, Money::Currency.new(currency_code).subunit_to_unit,
      championships.map(&:championship_type).sort.join(","), exempt_from_wca_dues?, organizers.map(&:name).sort.join(","),
      dues_per_competitor_in_usd * num_competitors, dues_payer_name, dues_payer_email, dues_payer_is_combined_invoice?, country.band&.number || 0,
      error
    ]
  end

  private def xero_dues_payer
    self.country&.wfc_dues_redirect&.redirect_to ||
      self.organizers.find { |organizer| organizer.wfc_dues_redirect.present? }&.wfc_dues_redirect&.redirect_to
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

  def form_announcement_data
    {
      isAnnounced: self.announced?,
      announcedBy: self.announced_by_user&.name,
      announcedAt: self.announced_at&.iso8601,
      isCancelled: self.cancelled?,
      canBeCancelled: self.can_be_cancelled?,
      cancelledBy: self.cancelled_by_user&.name,
      cancelledAt: self.cancelled_at&.iso8601,
      isRegistrationPast: self.registration_past?,
      isRegistrationFull: self.registration_full?,
      canCloseFullRegistration: self.orga_can_close_reg_full_limit?,
    }
  end

  def form_confirmation_data(for_user)
    {
      isConfirmed: self.confirmed?,
      canConfirm: for_user.can_confirm_competition?(self),
      isVisible: self.show_at_all?,
      cannotDeleteReason: for_user.get_cannot_delete_competition_reason(self),
    }
  end

  def form_user_preferences(for_user)
    {
      isReceivingNotifications: self.receiving_registration_emails?(for_user.id),
    }
  end

  def to_form_data
    {
      # TODO: enable this once we have persistent IDs
      # "id" => id,
      "competitionId" => id,
      "name" => name,
      "shortName" => cell_name,
      "nameReason" => name_reason,
      "venue" => {
        "countryId" => country_id,
        "cityName" => city_name,
        "name" => venue,
        "details" => venue_details,
        "address" => venue_address,
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
        "autoCloseThreshold" => auto_close_threshold,
        "newcomerMonthReservedSpots" => newcomer_month_reserved_spots,
        "autoAcceptPreference" => auto_accept_preference,
        "autoAcceptDisableThreshold" => auto_accept_disable_threshold,
      },
      "staff" => {
        "staffDelegateIds" => staff_delegates.to_a.pluck(:id),
        "traineeDelegateIds" => trainee_delegates.to_a.pluck(:id),
        "organizerIds" => organizers.to_a.pluck(:id),
        "contact" => contact,
      },
      "championships" => championship_types,
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
        "competitorCanCancel" => competitor_can_cancel,
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
      "cloning" => {
        "fromId" => being_cloned_from_id,
        "cloneTabs" => clone_tabs || false,
      },
    }
  end

  # It is quite uncool that we have to duplicate the internal form_data formatting like this
  # but as long as we let our backend handle the complete error validation we literally have no other choice
  def form_errors
    self_valid = self.valid?
    # If we're cloning, we also need to check the parent's associations.
    #   Otherwise, the user may be surprised by a silent fail if some tabs/venues/schedules
    #   of the parent are invalid. (This can happen if we introduce new validations on old data)
    self_valid &= being_cloned_from&.tabs&.all?(&:valid?) if being_cloned_from_id.present?

    return {} if self_valid

    {
      # for historic reasons, we keep 'name' errors listed under ID. Don't ask.
      "competitionId" => self.persisted? ? (errors[:id] + errors[:name]) : [],
      "name" => self.persisted? ? [] : (errors[:id] + errors[:name]),
      "shortName" => errors[:cell_name],
      "nameReason" => errors[:name_reason],
      "venue" => {
        "countryId" => errors[:country_id],
        "cityName" => errors[:city_name],
        "name" => errors[:venue],
        "details" => errors[:venue_details],
        "address" => errors[:venue_address],
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
        "autoCloseThreshold" => errors[:auto_close_threshold],
        "newcomer_month_reserved_spots" => errors[:newcomer_month_reserved_spots],
        "autoAcceptPreference" => errors[:auto_accept_preference],
        "autoAcceptDisableThreshold" => errors[:auto_accept_disable_threshold],
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
        "competitorCanCancel" => errors[:competitor_can_cancel],
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
      "cloning" => {
        "fromId" => errors[:being_cloned_from_id],
        "cloneTabs" => being_cloned_from_id.present? ? being_cloned_from&.association_errors(:tabs) : errors[:clone_tabs],
      },
      "other" => {
        "competitionEvents" => errors[:competition_events],
      },
    }
  end

  def self.compute_diff(old_form, new_form)
    compute_diff = HashDiff.left_diff(old_form, new_form)

    compute_diff.reject_values_recursive do |value|
      value == HashDiff::NO_VALUE
    end
  end

  def association_errors(association_name)
    self.public_send(association_name).map(&:errors).flat_map(&:to_a)
  end

  def set_form_data(form_data, current_user)
    JSON::Validator.validate!(Competition.form_data_json_schema, form_data)

    if self.confirmed? && !current_user.can_admin_competitions?
      current_state_form = self.to_form_data
      changed_form_data = Competition.compute_diff(current_state_form, form_data)

      # This is a much "stricter" version of the general schema above.
      #    If the Delegate submits fields that they are not allowed to edit,
      #    then these fields will not be included in the schema and validation will fail.
      JSON::Validator.validate!(Competition.delegate_edits_json_schema, changed_form_data)

      changed_form_data.each_recursive do |key, value, *prefixes|
        joined_key = (prefixes + [key]).join('.')

        # These keys all represent timestamps. They may only be edited by non-admins if...
        #   - the original value (pre-edit) has not yet passed
        #   - the new value is in the future (extending deadlines is allowed, shortening them is not)
        next unless %w[registration.closingDateTime registration.waitingListDeadlineDate registration.eventChangeDeadlineDate].include?(joined_key)

        existing_value = current_state_form.dig(*prefixes, key)

        previously_had_value = existing_value.present?
        will_have_value = value.present?

        # Complain if the existing timestamp lies in the past
        #   Note: Some timestamps are less strict than others (see https://github.com/thewca/worldcubeassociation.org/issues/11416)
        #   so we only enforce this validation on a subset of timestamps.
        edits_forbidden_if_past = %w[registration.closingDateTime registration.waitingListDeadlineDate].include?(joined_key)

        if previously_had_value && edits_forbidden_if_past
          existing_datetime = DateTime.parse(existing_value)

          raise WcaExceptions::BadApiParameter.new(I18n.t('competitions.errors.editing_deadline_already_passed', timestamp: existing_datetime), json_property: joined_key) if existing_datetime.past?
        end

        if will_have_value
          new_datetime = DateTime.parse(value)

          # Complain if the new timestamp lies in the past
          raise WcaExceptions::BadApiParameter.new(I18n.t('competitions.errors.edited_deadline_not_in_future', new_timestamp: new_datetime), json_property: joined_key) if new_datetime.past?
        end

        next unless previously_had_value && will_have_value

        new_datetime = DateTime.parse(value)
        existing_datetime = DateTime.parse(existing_value)

        new_before_existing = new_datetime < existing_datetime

        # Complain if the new value lies before the old value
        #   (i.e. the user is trying to move some deadline to end earlier)
        raise WcaExceptions::BadApiParameter.new(I18n.t('competitions.errors.edited_deadline_not_after_original', new_timestamp: new_datetime, timestamp: existing_datetime), json_property: joined_key) if new_before_existing
      end
    end

    ActiveRecord::Base.transaction do
      self.editing_user_id = current_user.id

      if (form_series = form_data["series"]).present?
        set_form_data_series(form_series, current_user)
      else
        self.competition_series = nil
      end

      self.championships = if (form_championships = form_data["championships"]).present?
                             form_championships.map do |type|
                               Championship.new(championship_type: type)
                             end
                           else
                             # explicitly sending an empty array of championships
                             #   (which prominently happens when removing the only championship there is)
                             #   makes `present?` return `false`, so we explicitly set this default value.
                             []
                           end

      assign_attributes(Competition.form_data_to_attributes(form_data))
    end
  end

  def self.form_data_to_attributes(form_data)
    {
      id: form_data['competitionId'],
      name: form_data['name'],
      city_name: form_data.dig('venue', 'cityName'),
      country_id: form_data.dig('venue', 'countryId'),
      information: form_data['information'],
      venue: form_data.dig('venue', 'name'),
      venue_address: form_data.dig('venue', 'address'),
      venue_details: form_data.dig('venue', 'details'),
      external_website: form_data.dig('website', 'externalWebsite'),
      cell_name: form_data['shortName'],
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
      auto_close_threshold: form_data.dig('competitorLimit', 'autoCloseThreshold'),
      newcomer_month_reserved_spots: form_data.dig('competitorLimit', 'newcomerMonthReservedSpots'),
      auto_accept_preference: form_data.dig('competitorLimit', 'autoAcceptPreference'),
      auto_accept_disable_threshold: form_data.dig('competitorLimit', 'autoAcceptDisableThreshold'),
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
      competitor_can_cancel: form_data.dig('registration', 'competitorCanCancel'),
      use_wca_live_for_scoretaking: form_data.dig('website', 'usesWcaLive'),
      allow_registration_without_qualification: form_data.dig('eventRestrictions', 'qualificationResults', 'allowRegistrationWithout'),
      guests_per_registration_limit: form_data.dig('registration', 'guestsPerRegistration'),
      events_per_registration_limit: form_data.dig('eventRestrictions', 'eventLimitation', 'perRegistrationLimit'),
      force_comment_in_registration: form_data.dig('registration', 'forceComment'),
      being_cloned_from_id: form_data.dig('cloning', 'fromId'),
      clone_tabs: form_data.dig('cloning', 'cloneTabs'),
    }
  end

  def set_form_data_series(form_data_series, current_user)
    raise WcaExceptions::BadApiParameter.new("Cannot change Competition Series") unless current_user.can_update_competition_series?(self)

    raise WcaExceptions::BadApiParameter.new("The Series must include the competition you're currently editing.") unless form_data_series["competitionIds"].include?(self.id)

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

  def manual_connected?
    self.payment_integration_connected?(:manual)
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
        "nameReason" => { "type" => %w[string null] },
        "venue" => {
          "type" => "object",
          "properties" => {
            "name" => { "type" => "string" },
            "cityName" => { "type" => "string" },
            "countryId" => { "type" => "string" },
            "details" => { "type" => %w[string null] },
            "address" => { "type" => %w[string null] },
            "coordinates" => {
              "type" => "object",
              "properties" => {
                "lat" => { "type" => %w[number string] },
                "long" => { "type" => %w[number string] },
              },
            },
          },
        },
        "startDate" => date_json_schema("date"),
        "endDate" => date_json_schema("date"),
        "series" => CompetitionSeries.form_data_json_schema,
        "information" => { "type" => %w[string null] },
        "competitorLimit" => {
          "type" => "object",
          "properties" => {
            "enabled" => { "type" => %w[boolean null] },
            "count" => { "type" => %w[integer null] },
            "reason" => { "type" => %w[string null] },
            "autoCloseThreshold" => { "type" => %w[integer null] },
            "newcomerMonthReservedSpots" => { "type" => %w[integer null] },
            "autoAcceptPreference" => { "type" => "string", "enum" => Competition.auto_accept_preferences.keys },
            "autoAcceptDisableThreshold" => { "type" => %w[integer null] },
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
            "contact" => { "type" => %w[string null] },
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
            "generateWebsite" => { "type" => %w[boolean null] },
            "externalWebsite" => { "type" => %w[string null] },
            "externalRegistrationPage" => { "type" => %w[string null] },
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
            "baseEntryFee" => { "type" => %w[integer null] },
            "onTheSpotEntryFee" => { "type" => %w[integer null] },
            "guestEntryFee" => { "type" => %w[integer null] },
            "donationsEnabled" => { "type" => %w[boolean null] },
            "refundPolicyPercent" => { "type" => %w[integer null] },
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
            "allowOnTheSpot" => { "type" => %w[boolean null] },
            "competitorCanCancel" => { "type" => "string", "enum" => Competition.competitor_can_cancels.keys },
            "allowSelfEdits" => { "type" => "boolean" },
            "guestsEnabled" => { "type" => "boolean" },
            "guestEntryStatus" => { "type" => "string" },
            "guestsPerRegistration" => { "type" => %w[integer null] },
            "extraRequirements" => { "type" => %w[string null] },
            "forceComment" => { "type" => %w[boolean null] },
          },
        },
        "eventRestrictions" => {
          "type" => "object",
          "properties" => {
            "forbidNewcomers" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => %w[string null] },
              },
            },
            "earlyPuzzleSubmission" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => %w[string null] },
              },
            },
            "qualificationResults" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => %w[string null] },
                "allowRegistrationWithout" => { "type" => %w[boolean null] },
              },
            },
            "eventLimitation" => {
              "type" => "object",
              "properties" => {
                "enabled" => { "type" => "boolean" },
                "reason" => { "type" => %w[string null] },
                "perRegistrationLimit" => { "type" => %w[integer null] },
              },
            },
            "mainEventId" => { "type" => %w[string null] },
          },
        },
        "remarks" => { "type" => %w[string null] },
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
            "fromId" => { "type" => %w[string null] },
            "cloneTabs" => { "type" => "boolean" },
          },
        },
      },
    }
  end

  # When comparing arrays through HashDiff, it implicitly converts the indices into keys.
  #   For example, a diff of "before: [1,2,3] -- after: [1,2,3,4]" will be reported as "{3 => 4}"
  #   because the element at index 3 on the right-hand side was added.
  # This means that things which were numeric arrays in the original data appear as hashes
  #   in the diff'ed data.
  def self.array_change_json_schema(**additional_properties)
    {
      "type" => "object",
      "additionalProperties" => additional_properties.deep_stringify_keys,
      "propertyNames" => { "pattern" => /^\d+$/ },
      "uniqueItems" => true,
    }
  end

  # Stuff that Delegates are allowed to edit even after the competition is announced,
  #   see also https://docs.google.com/document/d/1-GwE5OXurBUnR7EVBRTGIN_dGj3AaU7vvan_6RjOW7Q/edit
  def self.delegate_edits_json_schema
    {
      "type" => "object",
      "additionalProperties" => false,
      "properties" => {
        "information" => { "type" => %w[string null] },
        "staff" => {
          "type" => "object",
          "additionalProperties" => false,
          "properties" => {
            "staffDelegateIds" => self.array_change_json_schema(type: "integer"),
            "traineeDelegateIds" => self.array_change_json_schema(type: "integer"),
            "organizerIds" => self.array_change_json_schema(type: "integer"),
            "contact" => { "type" => %w[string null] },
          },
        },
        "website" => {
          "type" => "object",
          "additionalProperties" => false,
          "properties" => {
            "externalWebsite" => { "type" => %w[string null] },
            "usesWcaLive" => { "type" => "boolean" },
          },
        },
        "entryFees" => {
          "type" => "object",
          "additionalProperties" => false,
          "properties" => {
            "onTheSpotEntryFee" => { "type" => %w[integer null] },
            "donationsEnabled" => { "type" => %w[boolean null] },
          },
        },
        "registration" => {
          "type" => "object",
          "additionalProperties" => false,
          "properties" => {
            "closingDateTime" => date_json_schema("date-time"),
            "waitingListDeadlineDate" => date_json_schema("date-time"),
            "eventChangeDeadlineDate" => date_json_schema("date-time"),
            "allowOnTheSpot" => { "type" => %w[boolean null] },
            "competitorCanCancel" => { "type" => "string", "enum" => Competition.competitor_can_cancels.keys },
            "allowSelfEdits" => { "type" => "boolean" },
            "forceComment" => { "type" => %w[boolean null] },
          },
        },
        "eventRestrictions" => {
          "type" => "object",
          "additionalProperties" => false,
          "properties" => {
            "mainEventId" => { "type" => %w[string null] },
          },
        },
        "competitorLimit" => {
          "type" => "object",
          "properties" => {
            "autoAcceptPreference" => { "type" => "string", "enum" => Competition.auto_accept_preferences.keys },
            "autoAcceptDisableThreshold" => { "type" => %w[integer null] },
          },
        },
      },
    }
  end

  def fully_paid_registrations_count
    registrations
      .joins(:registration_payments)
      .merge(RegistrationPayment.completed)
      .group('registrations.id')
      .having('SUM(registration_payments.amount_lowest_denomination) >= ?', base_entry_fee_lowest_denomination)
      .count.size # .count changes the AssociationRelation into a hash, and then .size gives the number of items in the hash
  end

  def attempt_auto_close!
    return false if auto_close_threshold.nil?

    threshold_reached = fully_paid_registrations_count >= auto_close_threshold && auto_close_threshold.positive?
    threshold_reached && update(closing_full_registration: true, registration_close: Time.now)
  end

  def h2h_rounds
    self.rounds.h2h.map(&:wcif_id)
  end
end
