# frozen_string_literal: true
class UserPreferredEvent < ActiveRecord::Base
  belongs_to :user
  belongs_to :event

  validates :event_id, inclusion: { in: Event.official.map(&:id) }

  def event_object
    Event.find(event_id)
  end
end
