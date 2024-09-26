# frozen_string_literal: true

require 'time'

class V2Registration < ActiveRecord::Base

  has_many :registration_history_entry, foreign_key: :registration_id
  has_many :registration_lane, foreign_key: :registration_id
  belongs_to :competition
  belongs_to :user

  def competing_lane
    registration_lane.select { |l| l.lane_name == 'competing' }.first
  end

  def payment_lane
    registration_lane.select { |l| l.lane_name ==  'payment' }.first
  end

  # Returns all event ids irrespective of registration status
  def event_ids
    competing_lane.lane_details&.[]('event_details')&.pluck('event_id')
  end

  def registered_event_ids
    event_ids = []

    competing_lane.lane_details['event_details'].each do |event|
      if event['event_registration_state'] != 'cancelled'
        event_ids << event['event_id']
      end
    end
    event_ids
  end

  def event_details
    competing_lane&.lane_details&.[]('event_details')
  end

  def comment
    competing_lane&.lane_details&.[]('comment')
  end

  def admin_comment
    competing_lane&.lane_details&.[]('admin_comment')
  end

  def payment_ticket
    payment_lane&.lane_details&.[]('payment_id')
  end

  def payment_status
    payment_lane&.lane_state
  end

  def payment_amount
    payment_lane&.lane_details&.[]('amount_lowest_denominator')
  end

  def waiting_list_position(waiting_list)
    return nil if competing_status != 'waiting_list'
    waiting_list.entries.find_index(user_id) + 1
  end

  def payment_amount_human_readable
    payment_details = payment_lane&.lane_details
    unless payment_details.nil?
      MoneyFormat.format_human_readable(payment_details['amount_lowest_denominator'], payment_details['currency_code'])
    end
  end

  def payment_date
    payment_lane&.lane_details&.[]('last_updated')
  end

  def payment_history
    payment_lane&.lane_details&.[]('payment_history')
  end

  def registration_history
    registration_history_entry.map do |r|
      changed_attributes = r.registration_history_change.each_with_object({}) do |change, attrs|
        attrs[change.key] = change.value
      end

      {
        changed_attributes: changed_attributes,
        actor_type: r.actor_type,
        actor_id: r.actor_id,
        timestamp: r.timestamp,
        action: r.action
      }
    end
  end

  def update_competing_lane!(update_params)
    ActiveRecord::Base.transaction do
      if update_params[:status].present?
        competing_lane.lane_state = update_params[:status]

        competing_lane.lane_details['event_details'].each do |event|
          # NOTE: Currently event_registration_state is not used - when per-event registrations are added, we need to add validation logic to support cases like
          # limited registrations and waiting lists for certain events
          event['event_registration_state'] = update_params[:status]
        end
      end

      competing_lane.lane_details['comment'] = update_params[:comment] if update_params[:comment].present?
      competing_lane.lane_details['admin_comment'] = update_params[:admin_comment] if update_params[:admin_comment].present?

      competing_lane.save!

      if update_params[:event_ids].present? && update_params[:status] != 'cancelled'
        competing_lane.update_events!(update_params[:event_ids])
      end

      update_column(:guests, update_params[:guests]) if update_params[:guests].present?
    end
  end

  def add_history_entry(changes, actor_type, actor_id, action)
    new_entry = registration_history_entry.create(actor_type: actor_type, actor_id: actor_id, action: action)
    changes.keys.each do |key|
      new_entry.registration_history_change.create(from: changes[key][:from] || '', to: changes[key][:to], key: key.to_s)
    end
  end

  def init_payment_lane(amount, currency_code, id, donation)
    registration_lane.create(LaneFactory.payment_lane(amount, currency_code, id, donation))
  end

  def update_payment_lane(id, iso_amount, currency_iso, status)
    payment_lane.update_columns(lane_state: status, lane_details: {
      payment_id: id,
      amount_lowest_denominator: iso_amount,
      currency_code: currency_iso,
    })
  end

  def competing_status
    competing_lane&.lane_state
  end

  def might_attend?
    MIGHT_ATTEND_STATES.include?(competing_status)
  end
end
