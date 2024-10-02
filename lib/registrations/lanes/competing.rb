# frozen_string_literal: true

module Registrations
  module Lanes
    module Competing
      def self.process!(lane_params, user_id, competition_id)
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

      def self.update!(lane_params, current_user_id, competition_id)
        guests = lane_params[:guests]
        status = lane_params.dig('competing', 'status')
        comment = lane_params.dig('competing', 'comment')
        event_ids = lane_params.dig('competing', 'event_ids')
        admin_comment = lane_params.dig('competing', 'admin_comment')
        waiting_list_position = lane_params.dig('competing', 'waiting_list_position')
        user_id = lane_params[:user_id]

        registration = Registration.find_by(competition_id: competition_id, user_id: user_id)
        old_status = registration.competing_status

        if old_status == "waiting_list" || status == "waiting_list"
          waiting_list = competition.waiting_list || competition.waiting_list.build(entries: [])
        end

        ActiveRecord::Base.transaction do
          if status.present?
            registration.accepted_at = nil
            registration.deleted_at = nil
            registration.rejected_at = nil
            registration.waitlisted_at = nil
            case status
            when "waiting_list"
              registration.waitlisted_at = Time.now.utc
            when "accepted"
              registration.accepted_at = Time.now.utc
            when "cancelled"
              registration.deleted_at = Time.now.utc
            when "rejected"
              registration.rejected_at = Time.now.utc
            else
              # We already check this in the controller, so this shouldn't happen
              raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_REQUEST_DATA)
            end
          end
          registration.comments = comment if comment.present?
          registration.administrative_notes = admin_comment if admin_comment.present?
          registration.guests = guests if guests.present?

          changes = registration.changes.transform_values { |change| change[1] }

          if waiting_list_position.present?
            waiting_list.move_to_position(user_id, waiting_list_position)
            changes[:waiting_list_position] = waiting_list_position
          end

          if event_ids.present?
            changes[:event_ids] = event_ids
            registration.registration_competition_events.each do |registration_competition_event|
              if event_ids.include?(registration_competition_event.event_id)
                next
              end
              registration_competition_event.destroy
            end
            event_ids.each do |event_id|
              if registration.event_ids.include?(event_id)
                next
              end
              competition_event = registration.competition_events.find { |ce| ce.event_id == event_id }
              registration.registration_competition_events.build({ competition_event_id: competition_event.id })
            end
          end

          registration.save!
          registration.add_history_entry(changes, 'user', current_user_id, Registrations::Helper.action_type(lane_params, current_user_id))
        end

        # Only send emails when we update the competing status
        if status.present? && old_status != status
          case status
          when 'pending'
            RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_later
          when 'accepted'
            RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
          when 'rejected', 'cancelled'
            if user_id == current_user_id
              RegistrationsMailer.notify_organizers_of_deleted_registration(registration).deliver_later
            else
              RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
            end
          else
            # code would have errored out already
            raise "Unknown registration status, this should not happen"
          end
        end

        registration
      end
    end
  end
end
