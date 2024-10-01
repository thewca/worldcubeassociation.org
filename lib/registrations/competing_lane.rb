# frozen_string_literal: true

module Registrations
  module CompetingLane
    def self.create!(lane_params, user_id, competition_id)
      registration = Registration.build(competition_id: competition_id,
                                        user_id: user_id,
                                        comments: lane_params[:competing][:comment] || '',
                                        guests: lane_params[:guests] || 0)

      registration.registration_competition_events.build(lane_params[:competing][:event_ids].map do |event_id|
        competition_event = Competition.find(competition_id).competition_events.find { |ce| ce.event_id == event_id }
        { competition_event_id: competition_event.id }
      end)

      registration.save!
      registration.add_history_entry(lane_params, "worker", user_id, "Worker processed")
    end
  end
end
