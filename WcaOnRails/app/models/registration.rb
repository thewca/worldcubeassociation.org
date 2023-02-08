# frozen_string_literal: true

class Registration < ApplicationRecord
  scope :pending, -> { where(accepted_at: nil).where(deleted_at: nil) }
  scope :accepted, -> { where.not(accepted_at: nil).where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }
  scope :not_deleted, -> { where(deleted_at: nil) }
  scope :with_payments, -> { joins(:registration_payments).distinct }

  belongs_to :competition
  belongs_to :user, optional: true # A user may be deleted later. We only enforce validation directly on creation further down below.
  belongs_to :accepted_user, foreign_key: "accepted_by", class_name: "User", optional: true
  belongs_to :deleted_user, foreign_key: "deleted_by", class_name: "User", optional: true
  has_many :registration_competition_events
  has_many :registration_payments
  has_many :competition_events, through: :registration_competition_events
  has_many :events, through: :competition_events
  has_many :assignments, dependent: :delete_all

  serialize :roles, Array

  accepts_nested_attributes_for :registration_competition_events, allow_destroy: true

  validates :user, presence: true, on: [:create]

  validates_numericality_of :guests, greater_than_or_equal_to: 0

  validates_numericality_of :guests, less_than_or_equal_to: :guest_limit, if: :check_guest_limit?

  validate :registration_cannot_be_deleted_and_accepted_simultaneously
  private def registration_cannot_be_deleted_and_accepted_simultaneously
    if deleted? && accepted?
      errors.add(:registration_competition_events, I18n.t('registrations.errors.cannot_be_deleted_and_accepted'))
    end
  end

  def guest_limit
    competition.guests_per_registration_limit
  end

  def check_guest_limit?
    competition.present? && competition.guests_per_registration_limit_enabled?
  end

  def deleted?
    !deleted_at.nil?
  end

  def accepted?
    !accepted_at.nil? && !deleted?
  end

  def pending?
    !accepted? && !deleted?
  end

  def self.status_from_timestamp(accepted_at, deleted_at)
    if !accepted_at.nil? && deleted_at.nil?
      :accepted
    elsif accepted_at.nil? && deleted_at.nil?
      :pending
    else
      :deleted
    end
  end

  def checked_status
    Registration.status_from_timestamp(accepted_at, deleted_at)
  end

  def new_or_deleted?
    new_record? || deleted?
  end

  def name
    user.name
  end

  def birthday
    user.dob
  end

  def gender
    user.gender
  end

  def country
    user.country
  end

  def email
    user.email
  end

  def wca_id
    user.wca_id
  end

  alias personId wca_id

  def person
    Person.find_by_wca_id(personId)
  end

  def world_rank(event, type)
    person&.world_rank(event, type)
  end

  def best_solve(event, type)
    person&.best_solve(event, type) || SolveTime.new(event.id, type, 0)
  end

  def entry_fee
    # DEPRECATION WARNING: Rails 7.0 has deprecated Enumerable.sum in favor of Ruby's native implementation
    # available since 2.4. Sum of non-numeric elements requires an initial argument.
    zero_money = Money.new 0, competition.currency_code
    competition.base_entry_fee + competition_events.map(&:fee).sum(zero_money)
  end

  def paid_entry_fees
    Money.new(
      # NOTE: we do *not* sum on the association, as it bypasses any clean
      # registration.includes(:registration_payments) that may exist.
      # It's fine to turn the associated records to an array and sum on ithere,
      # as it's usually just a couple of rows.
      registration_payments.map(&:amount_lowest_denomination).sum,
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
    !new_record? && (pending? || accepted?) && competition.using_stripe_payments? && outstanding_entry_fees > 0
  end

  def show_payment_form?
    competition.registration_opened? && to_be_paid_through_wca?
  end

  def show_details?(user)
    (competition.registration_opened? || !(new_or_deleted?)) || (competition.user_can_pre_register?(user))
  end

  def record_payment(amount, currency_code, stripe_charge_id, user_id)
    registration_payments.create!(
      amount_lowest_denomination: amount,
      currency_code: currency_code,
      stripe_charge_id: stripe_charge_id,
      user_id: user_id,
    )
  end

  def record_refund(
    amount,
    currency_code,
    stripe_refund_id,
    refunded_registration_payment_id,
    user_id
  )
    registration_payments.create!(
      amount_lowest_denomination: amount * -1,
      currency_code: currency_code,
      stripe_charge_id: stripe_refund_id,
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

  def waiting_list_info
    pending_registrations = competition.registrations.pending.order(:created_at)
    index = pending_registrations.index(self)
    Hash.new(index: index, length: pending_registrations.length)
  end

  def to_wcif(authorized: false)
    authorized_fields = {
      "guests" => guests,
      "comments" => comments || '',
    }
    {
      "wcaRegistrationId" => id,
      "eventIds" => events.map(&:id).sort,
      "status" => if accepted?
                    'accepted'
                  elsif deleted?
                    'deleted'
                  else
                    'pending'
                  end,
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
      },
    }
  end

  # Only run the validations when creating the registration as we don't want user changes
  # to invalidate all the corresponding registrations (e.g. if the user gets banned).
  # Instead the validations should be placed such that they ensure that a user
  # change doesn't lead to an invalid state.
  validate :user_can_register_for_competition, on: :create
  private def user_can_register_for_competition
    if user&.cannot_register_for_competition_reasons.present?
      errors.add(:user_id, user.cannot_register_for_competition_reasons.to_sentence)
    end
  end

  validate :cannot_be_undeleted_when_banned, if: :deleted_at_changed?
  private def cannot_be_undeleted_when_banned
    if user.banned? && deleted_at.nil?
      errors.add(:user_id, I18n.t('registrations.errors.undelete_banned'))
    end
  end

  validate :must_register_for_gte_one_event
  private def must_register_for_gte_one_event
    if registration_competition_events.reject(&:marked_for_destruction?).empty?
      errors.add(:registration_competition_events, I18n.t('registrations.errors.must_register'))
    end
  end

  validate :must_not_register_for_more_events_than_event_limit
  private def must_not_register_for_more_events_than_event_limit
    if !competition.present? || !competition.events_per_registration_limit_enabled?
      return
    end
    if registration_competition_events.reject(&:marked_for_destruction?).length > competition.events_per_registration_limit
      errors.add(:registration_competition_events, I18n.t('registrations.errors.exceeds_event_limit', count: competition.events_per_registration_limit))
    end
  end

  validate :cannot_register_for_unqualified_events
  private def cannot_register_for_unqualified_events
    if competition && competition.allow_registration_without_qualification
      return
    end
    if registration_competition_events.reject(&:marked_for_destruction?).select { |event| !event.competition_event&.can_register?(user) }.any?
      errors.add(:registration_competition_events, I18n.t('registrations.errors.can_only_register_for_qualified_events'))
    end
  end

  validate :forcing_competitors_to_add_comment
  private def forcing_competitors_to_add_comment
    if competition&.force_comment_in_registration.present? && comments.strip.empty?
      errors.add(:user_id, I18n.t('registrations.errors.cannot_register_without_comment'))
    end
  end

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_event = competition.competition_events.find_by!(event: event)
      registration_competition_events.find_by_competition_event_id(competition_event.id) || registration_competition_events.build(competition_event: competition_event)
    end
  end

  validate :only_one_accepted_per_series
  private def only_one_accepted_per_series
    if competition&.part_of_competition_series? && checked_status == :accepted
      unless series_sibling_registrations(:accepted).empty?
        errors.add(:competition_id, I18n.t('registrations.errors.series_more_than_one_accepted'))
      end
    end
  end

  def series_sibling_registrations(registration_status = nil)
    return [] unless competition.part_of_competition_series?

    sibling_ids = competition.series_sibling_competitions.map(&:id)

    sibling_registrations = user.registrations
                                .where(competition_id: sibling_ids)

    if registration_status.nil?
      return sibling_registrations
             .joins(:competition)
             .order(:start_date)
    end

    # this relies on the scopes being named the same as `checked_status` but it is a significant performance improvement
    sibling_registrations.send(registration_status)
  end

  SERIES_SIBLING_DISPLAY_STATUSES = [:accepted, :pending].freeze

  def series_registration_info
    SERIES_SIBLING_DISPLAY_STATUSES.map { |st| series_sibling_registrations(st) }
                                   .map(&:count)
                                   .join(" + ")
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "competition_id", "user_id"],
    methods: ["event_ids"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
