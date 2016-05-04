class UserPreferredEvent < ActiveRecord::Base
  belongs_to :user

  validates :event_id, inclusion: { in: Event.all_official.map(&:id) }

  def event_object
    Event.find(event_id)
  end
end
