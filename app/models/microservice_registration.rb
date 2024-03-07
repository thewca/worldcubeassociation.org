# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition, inverse_of: :microservice_registrations
  belongs_to :user, inverse_of: :microservice_registrations

  has_many :assignments, as: :registration
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all

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
    return "accepted" if self.non_competing_dummy?

    self.read_ms_data :competing_status
  end

  alias :status :competing_status
  alias :wcif_status :competing_status

  def event_ids
    return [] if self.non_competing_dummy?

    self.read_ms_data :event_ids
  end

  def roles
    return [] if self.non_competing_dummy?

    self.read_ms_data :roles
  end

  def guests
    return 0 if self.non_competing_dummy?

    self.read_ms_data :guests
  end

  def comments
    # TODO: Better return nil here? -> Check WCIF spec!
    return '' if self.non_competing_dummy?

    self.read_ms_data :comments
  end

  def administrative_notes
    # TODO: Better return nil here? -> Check WCIF spec!
    return '' if self.non_competing_dummy?

    self.read_ms_data :administrative_notes
  end

  def accepted?
    self.status == "accepted"
  end

  def deleted?
    self.status == "cancelled"
  end

  def is_competing?
    !self.non_competing_dummy?
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

  def self.create_non_competing(competition, user_id)
    self.create(
      competition: competition,
      user_id: user_id,
      non_competing_dummy: true,
    )
  end

  def update_roles(new_roles)
    nil # TODO: stub
  end
end
