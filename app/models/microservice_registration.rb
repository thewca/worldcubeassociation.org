# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition, inverse_of: :microservice_registrations
  belongs_to :user, inverse_of: :microservice_registrations

  delegate :name, :email, to: :user

  attr_accessor :status, :event_ids

  def load_ms_model(ms_model)
    self.status = ms_model['status']
    self.event_ids = ms_model['event_ids']
  end

  def accepted?
    status == "accepted"
  end

  def deleted?
    status == "deleted"
  end
end
