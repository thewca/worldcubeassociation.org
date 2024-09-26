# frozen_string_literal: true

class AddRegistrationV2Job < ApplicationJob
  def perform(competition_id, user_id, event_ids, guests = 0, comment = '')
    ActiveRecord::Base.transaction do
      registration = V2Registration.create(competition_id: competition_id, user_id: user_id, guests: guests)
      registration.add_history_entry({ event_ids: event_ids, guests: guests, comment: comment }, 'user', user_id, 'Worker processed')
      registration.registration_lane.create(competing_lane(event_ids: event_ids, comment: comment))
    end
  end

  def competing_lane(event_ids: [], comment: '', admin_comment: '', registration_status: 'pending', waiting_list_position: nil)
    {
      lane_name: 'competing',
      completed_steps: ['Event Registration'],
      lane_state: registration_status,
      lane_details: {
        'event_details' => event_ids.map { |event_id| { event_id: event_id, event_registration_state: registration_status } },
        'comment' => comment,
        'admin_comment' => admin_comment,
        'waiting_list_position' => waiting_list_position.to_i,
      }
    }
  end
end
