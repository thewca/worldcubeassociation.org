# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition, inverse_of: :microservice_registrations
  belongs_to :user, inverse_of: :microservice_registrations

  has_many :assignments, as: :registration
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :payment_intents, as: :holder

  serialize :roles, coder: YAML

  delegate :name, :email, to: :user

  attr_accessor :ms_registration
  attr_writer :competing_status, :event_ids, :guests, :comments, :administrative_notes

  def load_ms_model(ms_model)
    self.ms_registration = ms_model

    self.competing_status = ms_model['competing_status']
    self.guests = ms_model['guests']

    competing_lane = ms_model['lanes']&.find { |lane| lane['lane_name'] == 'competing' }

    self.event_ids = competing_lane&.dig('lane_details', 'event_details')&.pluck('event_id')
    self.comments = competing_lane&.dig('lane_details', 'comment')
    self.administrative_notes = competing_lane&.dig('lane_details', 'admin_comment')
  end

  def ms_loaded?
    self.ms_registration.present?
  end

  private def read_ms_data(name_without_at)
    instance_variable_get(:"@#{name_without_at}").tap do
      raise "Microservice data not loaded!" unless ms_loaded?
    end
  end

  def competing_status
    # Treat non-competing registrations as accepted, see also `registration.rb`
    return "accepted" unless self.is_competing?

    self.read_ms_data :competing_status
  end

  alias :status :competing_status

  def wcif_status
    return "deleted" if self.deleted?
    return "pending" if self.pending?

    self.competing_status
  end

  def event_ids
    return [] unless self.is_competing?

    self.read_ms_data :event_ids
  end

  def guests
    return 0 unless self.is_competing?

    self.read_ms_data :guests
  end

  def comments
    # nil is not allowed here, see WCIF spec!
    return '' unless self.is_competing?

    self.read_ms_data :comments
  end

  def administrative_notes
    # nil is not allowed here, see WCIF spec!
    return '' unless self.is_competing?

    self.read_ms_data :administrative_notes
  end

  def accepted?
    self.status == "accepted"
  end

  def deleted?
    self.status == "cancelled"
  end

  def pending?
    # WCIF interprets "pending" as "not approved to compete yet"
    #   which is why these two statuses collapse into one.
    self.status == "pending" || self.status == "waiting_list"
  end

  def to_wcif(authorized: false)
    authorized_fields = {
      "guests" => guests,
      "comments" => comments || '',
      "administrativeNotes" => administrative_notes || '',
    }
    {
      "wcaRegistrationId" => id,
      "eventIds" => event_ids.sort,
      "status" => wcif_status,
      "isCompeting" => is_competing?,
    }.merge(authorized ? authorized_fields : {})
  end
end
