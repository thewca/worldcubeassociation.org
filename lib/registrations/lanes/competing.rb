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
        changes = registration.changes.transform_values { |change| change[1] }
        changes[:event_ids] = lane_params[:competing][:event_ids]
        registration.save!
        RegistrationsMailer.notify_organizers_of_new_registration(registration).deliver_later
        RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
        registration.add_history_entry(changes, "worker", user_id, "Worker processed")
      end

      def self.update!(update_params, competition, current_user_id)
        guests = update_params[:guests]
        status = update_params.dig('competing', 'status')
        comment = update_params.dig('competing', 'comment')
        event_ids = update_params.dig('competing', 'event_ids')
        admin_comment = update_params.dig('competing', 'admin_comment')
        waiting_list_position = update_params.dig('competing', 'waiting_list_position')
        user_id = update_params[:user_id]

        registration = Registration.find_by(competition_id: competition.id, user_id: user_id)
        old_status = registration.competing_status

        ActiveRecord::Base.transaction do
          update_event_ids(registration, event_ids)
          registration.comments = comment if comment.present?
          registration.administrative_notes = admin_comment if admin_comment.present?
          registration.guests = guests if guests.present?

          if old_status == Registrations::Helper::STATUS_WAITING_LIST || status == Registrations::Helper::STATUS_WAITING_LIST
            waiting_list = competition.waiting_list || competition.create_waiting_list(entries: [])
            update_waiting_list(update_params[:competing], registration, waiting_list)
          end

          update_status(registration, status) # Update status after updating waiting list so that can access the old_status

          changes = registration.changes.transform_values { |change| change[1] }

          if waiting_list_position.present?
            changes[:waiting_list_position] = waiting_list_position
          end

          changes[:event_ids] = event_ids if event_ids.present?

          registration.save!
          registration.add_history_entry(changes, 'user', current_user_id, Registrations::Helper.action_type(update_params, current_user_id))
        end

        send_status_change_email(registration, status, user_id, current_user_id) if status.present? && old_status != status

        # TODO: V3-REG Cleanup Figure out a way to get rid of this reload
        registration.reload
      end

      def self.update_waiting_list(competing_params, registration, waiting_list)
        status = competing_params['status']
        waiting_list_position = competing_params['waiting_list_position']

        should_add = status == Registrations::Helper::STATUS_WAITING_LIST # TODO: Add case where waiting_list status is present but that matches the old_status
        should_move = waiting_list_position.present? # TODO: Add case where waiting list pos is present but it matches the current position
        should_remove = status.present? && registration.competing_status == Registrations::Helper::STATUS_WAITING_LIST &&
                        status != Registrations::Helper::STATUS_WAITING_LIST # TODO: Consider adding cases for when not all of these are true?

        waiting_list.add(registration.id) if should_add
        waiting_list.move_to_position(registration.id, competing_params[:waiting_list_position].to_i) if should_move
        waiting_list.remove(registration.id) if should_remove
      end

      def self.update_status(registration, status)
        return unless status.present?

        registration.competing_status = status
      end

      def self.send_status_change_email(registration, status, user_id, current_user_id)
        case status
        when Registrations::Helper::STATUS_WAITING_LIST
          # TODO: V3-REG Cleanup, at new waiting list email
        when Registrations::Helper::STATUS_PENDING
          RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_later
        when Registrations::Helper::STATUS_ACCEPTED
          RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
        when Registrations::Helper::STATUS_REJECTED, Registrations::Helper::STATUS_DELETED, Registrations::Helper::STATUS_CANCELLED
          if user_id == current_user_id
            RegistrationsMailer.notify_organizers_of_deleted_registration(registration).deliver_later
          else
            RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
          end
        else
          raise "Unknown registration status, this should not happen"
        end
      end

      def self.update_event_ids(registration, event_ids)
        # TODO: V3-REG Cleanup, this is probably why we need the reload above
        return unless event_ids.present?

        registration.registration_competition_events.each do |registration_competition_event|
          registration_competition_event.destroy unless event_ids.include?(registration_competition_event.competition_event.event_id)
        end

        event_ids.each do |event_id|
          unless registration.event_ids.include?(event_id)
            competition_event = registration.competition.competition_events.find { |ce| ce.event_id == event_id }
            registration.registration_competition_events.build({ competition_event_id: competition_event.id })
          end
        end
      end
    end
  end
end
