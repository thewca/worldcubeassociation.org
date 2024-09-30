# frozen_string_literal: true

module Registrations
  module Lanes
    def self.competing_lane(registration, lane_params, current_user, competition_id)
      registration.comments = lane_params[:comment] || ''
      registration.guests = lane_params[:guests] || 0
      registration.registration_competition_events.build(lane_params[:event_ids].map do |event_id|
        competition_event = Competition.find(competition_id).competition_events.find { |ce| ce.event_id == event_id }
        { competition_event_id: competition_event.id }
      end)
      registration.save!
      registration.add_history_entry(lane_params, "worker", current_user, "Worker processed")
    end
  end
end
