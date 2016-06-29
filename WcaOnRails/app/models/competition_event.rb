class CompetitionEvent < ActiveRecord::Base
  belongs_to :competition
  belongs_to :event

  def event_object
    Event.find(event_id)
  end
end
