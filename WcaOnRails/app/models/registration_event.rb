# frozen_string_literal: true
class RegistrationEvent < ActiveRecord::Base
  belongs_to :registration
  belongs_to :event

  validate :event_must_be_offered
  private def event_must_be_offered
    if registration && !registration.competition.events.include?(event_object)
      errors.add(:events, "invalid event id: #{event_id}")
    end
  end

  def event_object
    Event.find(event_id)
  end
end
