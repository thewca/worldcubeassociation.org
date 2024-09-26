# frozen_string_literal: true

class RegistrationLane < ActiveRecord::Base
  def update_events!(new_event_ids)
    if lane_name == 'competing'
      current_event_ids = lane_details['event_details'].pluck('event_id')

      # Update events list with new events
      new_event_ids.each do |id|
        next if current_event_ids.include?(id)
        new_details = {
          'event_id' => id,
          # NOTE: Currently event_registration_state is not used - when per-event registrations are added, we need to add validation logic to support cases like
          # limited registrations and waiting lists for certain events
          'event_registration_state' => lane_state,
        }
        lane_details['event_details'] << new_details
      end

      # Remove events not in the new events list
      lane_details['event_details'].delete_if do |event|
        !(new_event_ids.include?(event['event_id']))
      end
      save
    end
  end
end
