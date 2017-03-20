# frozen_string_literal: true
class Registration < ApplicationRecord
  scope :pending, -> { where(accepted_at: nil).where(deleted_at: nil) }
  scope :accepted, -> { where.not(accepted_at: nil).where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }
  scope :with_payments, -> { joins(:registration_payments).distinct }

  belongs_to :competition
  belongs_to :user
  belongs_to :accepted_user, foreign_key: "accepted_by", class_name: "User"
  belongs_to :deleted_user, foreign_key: "deleted_by", class_name: "User"
  has_many :registration_competition_events
  has_many :registration_payments
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

  def checked_status
    if accepted?
      :accepted
    elsif pending?
      :pending
    else
      :deleted
    end
  end

  def new_or_deleted?
    new_record? || deleted?
  end

  def name
    user.name
  end

  attr_accessor :pos
  attr_accessor :tied_previous

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
    competition.base_entry_fee
  end

  def paid_entry_fees
    Money.new(
      registration_payments.sum(:amount_lowest_denomination),
      competition.currency_code,
    )
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

  def record_payment(amount, currency_code, stripe_charge_id)
    registration_payments.create!(
      amount_lowest_denomination: amount,
      currency_code: currency_code,
      stripe_charge_id: stripe_charge_id,
    )
  end

  def record_refund(
    amount,
    currency_code,
    stripe_refund_id,
    refunded_registration_payment_id
  )
    registration_payments.create!(
      amount_lowest_denomination: amount * -1,
      currency_code: currency_code,
      stripe_charge_id: stripe_refund_id,
      refunded_registration_payment_id: refunded_registration_payment_id,
    )
  end

  # Since Registration.events only includes saved events
  # this method is required to ensure that in any forms which
  # select events, unsaved events are still presented if
  # there are any validation issues on the form.
  def saved_and_unsaved_events
    registration_competition_events
      .joins(:competition_event)
      .joins(:event)
      .reject(&:marked_for_destruction?)
      .map(&:event)
      .sort_by(&:rank)
  end

  def waiting_list_info
    pending_registrations = competition.registrations.pending.order(:created_at)
    index = pending_registrations.index(self)
    OpenStruct.new(index: index, length: pending_registrations.length)
  end

  validate :user_can_register_for_competition
  private def user_can_register_for_competition
    if user&.cannot_register_for_competition_reasons.present?
      errors.add(:user_id, user.cannot_register_for_competition_reasons.to_sentence)
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
end
