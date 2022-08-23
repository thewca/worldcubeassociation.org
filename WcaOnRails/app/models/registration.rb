# frozen_string_literal: true

class Registration < ApplicationRecord
  scope :pending, -> { where(accepted_at: nil).where(deleted_at: nil) }
  scope :accepted, -> { where.not(accepted_at: nil).where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }
  scope :not_deleted, -> { where(deleted_at: nil) }
  scope :with_payments, -> { joins(:registration_payments).distinct }

  belongs_to :competition
  belongs_to :user
  belongs_to :accepted_user, foreign_key: "accepted_by", class_name: "User"
  belongs_to :deleted_user, foreign_key: "deleted_by", class_name: "User"
  has_many :registration_competition_events
  has_many :registration_payments
  has_many :competition_events, through: :registration_competition_events
  has_many :events, through: :competition_events
  has_many :assignments, dependent: :delete_all

  serialize :roles, Array

  accepts_nested_attributes_for :registration_competition_events, allow_destroy: true

  validates :user, presence: true, on: [:create]
  validates :competition, presence: { message: I18n.t('registrations.errors.comp_not_found') }

  validates_numericality_of :guests, greater_than_or_equal_to: 0

  validate :registration_cannot_be_deleted_and_accepted_simultaneously
  private def registration_cannot_be_deleted_and_accepted_simultaneously
    if deleted? && accepted?
      errors.add(:registration_competition_events, I18n.t('registrations.errors.cannot_be_deleted_and_accepted'))
    end
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
    competition.base_entry_fee + competition_events.to_a.sum(&:fee)
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

  def show_details?
    competition.registration_opened? || !(new_or_deleted?)
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

  # For associated_events_picker
  def events_to_associated_events(events)
    events.map do |event|
      competition_event = competition.competition_events.find_by!(event: event)
      registration_competition_events.find_by_competition_event_id(competition_event.id) || registration_competition_events.build(competition_event: competition_event)
    end
  end

  def series_sibling_registrations(registration_status = nil)
    return [] unless competition.series

    sibling_ids = competition.series_sibling_competitions.map(&:id)

    sibling_registrations = user.registrations
                                .select { |r| sibling_ids.include?(r.competition_id) }

    if registration_status.nil?
      return sibling_registrations
        .sort_by { |r| r.competition.start_date }
    end

    sibling_registrations.select { |r| r.checked_status == registration_status }
  end

  SERIES_SIBLING_DISPLAY_STATUSES = [:accepted, :pending]

  def series_sibling_registration_info
    SERIES_SIBLING_DISPLAY_STATUSES.map { |st| series_sibling_registrations(st) }
                                   .map(&:count)
                                   .join(" + ")
  end

  def serializable_hash(options = nil)
    {
      id: id,
      competition_id: competition_id,
      user_id: user_id,
      event_ids: events.map(&:id),
    }
  end
end
