# frozen_string_literal: true

class Registration < ApplicationRecord
  include Waitlistable

  COMMENT_CHARACTER_LIMIT = 240
  DEFAULT_GUEST_LIMIT = 99

  scope :pending, -> { where(competing_status: 'pending') }
  scope :accepted, -> { where(competing_status: 'accepted') }
  scope :cancelled, -> { where(competing_status: 'cancelled') }
  scope :rejected, -> { where(competing_status: 'rejected') }
  scope :waitlisted, -> { where(competing_status: 'waiting_list') }
  scope :non_competing, -> { where(is_competing: false) }
  scope :competing, -> { where(is_competing: true) }
  scope :not_cancelled, -> { where.not(competing_status: 'cancelled') }
  scope :with_payments, -> { joins(:registration_payments).distinct }
  scope :wcif_ordered, -> { order(:id) }
  scope :might_attend, -> { where(competing_status: ['accepted', 'waiting_list']) }

  belongs_to :competition
  belongs_to :user, optional: true # A user may be deleted later. We only enforce validation directly on creation further down below.
  has_many :registration_history_entries, -> { order(:created_at) }, dependent: :destroy
  has_many :registration_competition_events
  has_many :registration_payments
  has_many :competition_events, through: :registration_competition_events
  has_many :events, through: :competition_events
  has_many :live_results
  has_many :assignments, as: :registration, dependent: :delete_all
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :payment_intents, as: :holder, dependent: :delete_all

  enum :competing_status, {
    pending: Registrations::Helper::STATUS_PENDING,
    accepted: Registrations::Helper::STATUS_ACCEPTED,
    cancelled: Registrations::Helper::STATUS_CANCELLED,
    rejected: Registrations::Helper::STATUS_REJECTED,
    waiting_list: Registrations::Helper::STATUS_WAITING_LIST,
  }, prefix: true, validate: { frontend_code: Registrations::ErrorCodes::INVALID_REQUEST_DATA }

  serialize :roles, coder: YAML

  # TODO: V3-REG cleanup. The "accepts_nested_attributes_for" directly below can be removed.
  accepts_nested_attributes_for :registration_competition_events, allow_destroy: true
  validates_associated :registration_competition_events

  validates :user, presence: true, on: [:create]

  validates :registered_at, presence: true
  # Set a `registered_at` timestamp for newly created records,
  #   but only if there is no value already specified from the outside
  after_initialize :mark_registered_at, if: :new_record?, unless: :registered_at?

  private def mark_registered_at
    self.registered_at = current_time_from_proper_timezone
  end

  validates :guests, numericality: { greater_than_or_equal_to: 0 }
  validates :guests, numericality: { less_than_or_equal_to: :guest_limit, if: :check_guest_limit?, frontend_code: Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED }
  validates :guests, numericality: { equal_to: 0, unless: :guests_allowed?, frontend_code: Registrations::ErrorCodes::GUEST_LIMIT_EXCEEDED }
  validates :guests, numericality: { less_than_or_equal_to: DEFAULT_GUEST_LIMIT, if: :guests_unrestricted?, frontend_code: Registrations::ErrorCodes::UNREASONABLE_GUEST_COUNT }

  after_save :mark_registration_processing_as_done

  private def mark_registration_processing_as_done
    Rails.cache.delete(CacheAccess.registration_processing_cache_key(competition_id, user_id))
  end

  def update_lanes!(params, acting_user)
    Registrations::Lanes::Competing.update!(params, self.competition, acting_user.id)
  end

  def guest_limit
    competition.guests_per_registration_limit
  end

  def check_guest_limit?
    competition&.guests_per_registration_limit_enabled?
  end

  def guests_allowed?
    competition&.guests_enabled?
  end

  def guests_unrestricted?
    !competition&.guest_entry_status_restricted?
  end

  def rejected?
    competing_status_rejected?
  end

  def cancelled?
    competing_status_cancelled?
  end

  def waitlisted?
    competing_status_waiting_list?
  end

  # Can NOT use a `has_one :waiting_list, through: :competition` association here, because
  #   that would screw us over with caching. Unfortunately, even `through` associations cache themselves
  #   so every registration of a competition then effectively has "its own" waiting list.
  #   (We might want to revisit this decision when we switch to hook-based committing in waitlistable.rb)
  delegate :waiting_list, to: :competition, allow_nil: true

  def waitlistable?
    waitlisted?
  end

  def accepted?
    competing_status_accepted?
  end

  def pending?
    competing_status_pending?
  end

  def might_attend?
    accepted? || waitlisted?
  end

  def new_or_deleted?
    new_record? || cancelled? || !is_competing?
  end

  delegate :name, :gender, :country, :email, :dob, :wca_id, to: :user

  alias_method :birthday, :dob
  alias_method :personId, :wca_id

  def person
    Person.find_by(wca_id: personId)
  end

  def world_rank(event, type)
    person&.world_rank(event, type)
  end

  def best_solve(event, type)
    person&.best_solve(event, type) || SolveTime.new(event.id, type, 0)
  end

  def entry_fee
    sum_lowest_denomination = competition.base_entry_fee + competition_events.sum(&:fee_lowest_denomination)

    Money.new(
      sum_lowest_denomination,
      competition.currency_code,
    )
  end

  def entry_fee_with_donation(iso_donation_amount = 0)
    entry_fee + Money.new(iso_donation_amount, entry_fee.currency)
  end

  def paid_entry_fees
    Money.new(
      # NOTE: we do *not* sum on the association, as it bypasses any clean
      # registration.includes(:registration_payments) that may exist.
      # It's fine to turn the associated records to an array and sum on ithere,
      # as it's usually just a couple of rows.
      registration_payments.sum(&:amount_lowest_denomination),
      competition.currency_code,
    )
  end

  def last_payment_date
    registration_payments.map(&:created_at).max
  end

  def outstanding_entry_fees
    entry_fee - paid_entry_fees
  end

  def to_be_paid_through_wca?
    !new_record? && (pending? || accepted?) && competition.using_payment_integrations? && outstanding_entry_fees > 0
  end

  def record_payment(
    amount_lowest_denomination,
    currency_code,
    receipt,
    user_id
  )
    add_history_entry({ payment_status: receipt.determine_wca_status, iso_amount: amount_lowest_denomination }, "user", user_id, 'Payment')
    registration_payments.create!(
      amount_lowest_denomination: amount_lowest_denomination,
      currency_code: currency_code,
      receipt: receipt,
      user_id: user_id,
    )
  end

  def record_refund(
    amount_lowest_denomination,
    currency_code,
    receipt,
    refunded_registration_payment_id,
    user_id
  )
    add_history_entry({ payment_status: "refund", iso_amount: paid_entry_fees.cents - amount_lowest_denomination }, "user", user_id, 'Refund')
    registration_payments.create!(
      amount_lowest_denomination: amount_lowest_denomination.abs * -1,
      currency_code: currency_code,
      receipt: receipt,
      refunded_registration_payment_id: refunded_registration_payment_id,
      user_id: user_id,
    )
  end

  # Since Registration.events only includes saved events
  # this method is required to ensure that in any forms which
  # select events, unsaved events are still presented if
  # there are any validation issues on the form.
  def saved_and_unsaved_events
    registration_competition_events.reject(&:marked_for_destruction?).map(&:event)
  end

  def add_history_entry(changes, actor_type, actor_id, action, timestamp = Time.now.utc)
    new_entry = registration_history_entries.create(actor_type: actor_type, actor_id: actor_id, action: action, created_at: timestamp)
    changes.each_key do |key|
      new_entry.registration_history_changes.create(value: changes[key], key: key)
    end
  end

  def wcif_status
    # Non-competing staff are treated as accepted.
    # TODO: WCIF spec needs to be updated - and possibly versioned - to include new statuses
    if accepted? || !is_competing?
      'accepted'
    elsif cancelled? || rejected?
      'deleted'
    elsif pending? || waitlisted?
      'pending'
    end
  end

  def registration_history
    registration_history_entries.map do |r|
      changed_attributes = r.registration_history_changes.each_with_object({}) do |change, attrs|
        attrs[change.key] = if change.key == 'event_ids'
                              JSON.parse(change.value) # Assuming 'event_ids' is stored as JSON array in `to`
                            else
                              change.value
                            end
      end
      {
        changed_attributes: changed_attributes,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        timestamp: r.created_at,
        action: r.action,
      }
    end
  end

  def to_v2_json(admin: false, history: false, pii: false)
    private_attributes = pii ? %w[dob email] : nil

    base_json = {
      user: user.as_json(only: %w[id wca_id name gender country_iso2], methods: %w[country], include: [], private_attributes: private_attributes),
      user_id: user_id,
      competing: {
        event_ids: event_ids,
      },
    }
    if admin
      if competition.using_payment_integrations?
        base_json.deep_merge!({
                                payment: {
                                  has_paid: outstanding_entry_fees <= 0,
                                  payment_statuses: registration_payments.sort_by(&:created_at).reverse.map(&:payment_status),
                                  payment_amount_iso: paid_entry_fees.cents,
                                  payment_amount_human_readable: "#{paid_entry_fees.format} (#{paid_entry_fees.currency.name})",
                                  updated_at: last_payment_date,
                                },
                              })
      end
      base_json.deep_merge!({
                              guests: guests,
                              competing: {
                                registration_status: is_competing ? competing_status : 'non_competing',
                                registered_on: registered_at,
                                comment: comments || "",
                                admin_comment: administrative_notes|| "",
                              },
                            })
      base_json[:competing][:waiting_list_position] = waiting_list_position if competing_status_waiting_list?
    end
    if history
      base_json.deep_merge!({
                              history: registration_history,
                            })
    end
    base_json
  end

  def to_wcif(authorized: false)
    authorized_fields = {
      "guests" => guests,
      "comments" => comments || '',
      "administrativeNotes" => administrative_notes || '',
    }
    {
      "wcaRegistrationId" => id,
      "eventIds" => events.map(&:id).sort,
      "status" => wcif_status,
      "isCompeting" => is_competing?,
    }.merge(authorized ? authorized_fields : {})
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"], # NOTE: for now there may be WCIF persons without registration.
      "properties" => {
        "wcaRegistrationId" => { "type" => "integer" },
        "eventIds" => { "type" => "array", "items" => { "type" => "string", "enum" => Event.pluck(:id) } },
        "status" => { "type" => "string", "enum" => %w(accepted deleted pending) },
        "guests" => { "type" => "integer" },
        "comments" => { "type" => "string" },
        "administrativeNotes" => { "type" => "string" },
        "isCompeting" => { "type" => "boolean" },
      },
    }
  end

  def self.accepted_count
    accepted.count
  end

  def self.accepted_and_competing_count
    accepted.competing.count
  end

  def self.accepted_and_paid_pending_count
    accepted_count + pending.with_payments.count
  end

  def self.newcomer_month_eligible_competitors_count
    joins(:user).merge(User.newcomer_month_eligible).accepted_count
  end

  # Only run the validations when creating the registration as we don't want user changes
  # to invalidate all the corresponding registrations (e.g. if the user gets banned).
  # Instead the validations should be placed such that they ensure that a user
  # change doesn't lead to an invalid state.
  validate :user_can_register_for_competition, on: :create, unless: :rejected?
  private def user_can_register_for_competition
    cannot_register_reasons = user&.cannot_register_for_competition_reasons(competition, is_competing: self.is_competing?)
    errors.add(:user_id, cannot_register_reasons.to_sentence) if cannot_register_reasons.present?
  end

  # TODO: V3-REG cleanup. All these Validations can be used instead of the registration_checker checks
  validate :cannot_be_undeleted_when_banned, if: :competing_status_changed?
  private def cannot_be_undeleted_when_banned
    errors.add(:user_id, I18n.t('registrations.errors.undelete_banned')) if user.banned_at_date?(competition.start_date) && might_attend?
  end

  validates :registration_competition_events, presence: {
                                                if: :is_competing?,
                                                message: I18n.t('registrations.errors.must_register'),
                                                frontend_code: Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
                                              },
                                              length: {
                                                maximum: :events_limit,
                                                if: :events_limit_enabled?,
                                                message: ->(registration, _data) {
                                                  I18n.t('registrations.errors.exceeds_event_limit', count: registration.events_limit)
                                                },
                                                frontend_code: Registrations::ErrorCodes::INVALID_EVENT_SELECTION,
                                              }

  def events_limit
    competition&.events_per_registration_limit
  end

  def events_limit_enabled?
    competition&.events_per_registration_limit_enabled?
  end

  delegate :allow_registration_without_qualification?, to: :competition, allow_nil: true

  strip_attributes only: [:comments, :administrative_notes]

  validates :comments, length: { maximum: COMMENT_CHARACTER_LIMIT, frontend_code: Registrations::ErrorCodes::USER_COMMENT_TOO_LONG },
                       presence: { message: I18n.t('registrations.errors.cannot_register_without_comment'), if: :force_comment?, frontend_code: Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING }

  validates :administrative_notes, length: { maximum: COMMENT_CHARACTER_LIMIT, frontend_code: Registrations::ErrorCodes::USER_COMMENT_TOO_LONG }

  def force_comment?
    competition&.force_comment_in_registration?
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_event = competition.competition_events.find_by!(event: event)
      registration_competition_events.find_by(competition_event_id: competition_event.id) || registration_competition_events.build(competition_event: competition_event)
    end
  end

  def permit_user_cancellation?
    case competition.competitor_can_cancel.to_sym
    when :always
      true
    when :not_accepted
      !accepted?
    when :unpaid
      paid_entry_fees == 0
    end
  end

  def consider_auto_close
    outstanding_entry_fees.zero? && competition.attempt_auto_close!
  end

  def trying_to_accept?
    competing_status_changed? && competing_status_accepted?
  end

  delegate :newcomer_month_eligible?, to: :user

  validate :cannot_exceed_newcomer_limit, if: [
    :trying_to_accept?,
    :competitor_limit_enabled?,
    :enforce_newcomer_month_reservations?,
  ], unless: :newcomer_month_eligible?

  private def cannot_exceed_newcomer_limit
    available_spots = competition.competitor_limit - competition.registrations.accepted_and_competing_count

    # There are a limited number of "reserved" spots for newcomer_month_eligible competitions
    # We know that there are _some_ available_spots in the comp available, because we passed the competitor_limit check above
    # However, we still don't know how many of the reserved spots have been taken up by newcomers, versus how many "general" spots are left
    # For a non-newcomer to be accepted, there need to be more spots available than spots still reserved for newcomers
    return if available_spots > competition.newcomer_month_reserved_spots_remaining

    errors.add(:competing_status, :exceeding_newcomer_limit, frontend_code: Registrations::ErrorCodes::NO_UNRESERVED_SPOTS_REMAINING)
  end

  delegate :competitor_limit_enabled?, :enforce_newcomer_month_reservations?, to: :competition

  validate :cannot_exceed_competitor_limit, if: [:trying_to_accept?, :competitor_limit_enabled?]
  private def cannot_exceed_competitor_limit
    return unless competition.registrations.accepted_and_competing_count >= competition.competitor_limit

    errors.add(
      :competing_status,
      :exceeding_competitor_limit,
      frontend_code: Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED,
    )
  end

  validate :only_one_accepted_per_series, if: [:part_of_competition_series?, :trying_to_accept?]
  private def only_one_accepted_per_series
    return unless series_sibling_registrations.accepted.any?

    errors.add(
      :competition_id,
      :already_registered_in_series,
      message: I18n.t('registrations.errors.series_more_than_one_accepted'),
      frontend_code: Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES,
    )
  end

  delegate :part_of_competition_series?, to: :competition, allow_nil: true

  def series_sibling_registrations
    return [] unless part_of_competition_series?

    competition.series_sibling_registrations
               .where(user_id: self.user_id)
  end

  def ensure_waitlist_eligibility!
    raise ArgumentError.new("Registration must have a competing_status of 'waiting_list' to be added to the waiting list") unless
      competing_status == Registrations::Helper::STATUS_WAITING_LIST
  end

  def trying_to_cancel?
    competing_status_changed? && (competing_status_cancelled? || competing_status_rejected?)
  end

  validate :not_changing_events_when_cancelling, if: [:trying_to_cancel?, :tracked_event_ids?, :competition_events_changed?]
  private def not_changing_events_when_cancelling
    errors.add(:competition_events, :cannot_change_events_when_cancelling, message: I18n.t('registrations.errors.cannot_change_events_when_cancelling'), frontend_code: Registrations::ErrorCodes::INVALID_REQUEST_DATA)
  end

  attr_writer :tracked_event_ids

  def tracked_event_ids?
    @tracked_event_ids.present?
  end

  def tracked_event_ids
    @tracked_event_ids ||= self.event_ids
  end

  def volatile_event_ids
    # When checking registration validity as part of the user-facing registration frontend,
    #   we want to avoid database writes at all cost. So we create an in-memory dummy registration,
    #   but unfortunately `through` association support is very limited for such volatile models.
    registration_competition_events.map(&:event_id)
  end

  def competition_events_changed?
    self.tracked_event_ids.sort != self.volatile_event_ids.sort ||
      self.competition_events.any?(&:changed?)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "competition_id", "user_id"],
    methods: ["event_ids"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
