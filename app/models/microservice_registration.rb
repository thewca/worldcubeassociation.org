# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition, inverse_of: :microservice_registrations
  belongs_to :user, inverse_of: :microservice_registrations

  delegate :name, :email, to: :user

  attr_accessor :ms_registration
  attr_writer :competing_status, :event_ids

  def load_ms_model(ms_model)
    self.ms_registration = ms_model

    self.competing_status = ms_model['competing_status']

    self.event_ids = ms_model['lanes']&.find do |lane|
      lane['lane_name'] == 'competing'
    end&.dig('lane_details', 'event_details')&.pluck('event_id')
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
    self.read_ms_data :competing_status
  end

  alias :status :competing_status

  def event_ids
    self.read_ms_data :event_ids
  end

  def accepted?
    self.status == "accepted"
  end

  def deleted?
    self.status == "cancelled"
  end
end
