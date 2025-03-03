# frozen_string_literal: true

module Registrations
  module Lanes
    module Competing
      def self.process!(lane_params, user_id, competition_id)
        registration = Registration.build(competition_id: competition_id,
                                          user_id: user_id,
                                          comments: lane_params[:competing][:comment] || '',
                                          guests: lane_params[:guests] || 0)

        create_event_ids = lane_params[:competing][:event_ids]

        create_competition_events = registration.competition.competition_events.where(event_id: create_event_ids)
        registration.competition_events = create_competition_events

        changes = registration.changes.transform_values { |change| change[1] }
        changes[:event_ids] = create_event_ids
        registration.save!
        RegistrationsMailer.notify_organizers_of_new_registration(registration).deliver_later
        RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
        if registration.user.banned_in_past?
          RegistrationsMailer.notify_delegates_of_formerly_banned_user_registration(registration).deliver_later
        end
        registration.add_history_entry(changes, "worker", user_id, "Worker processed")
      end

      def self.update!(update_params, competition, acting_user_id)
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
          registration.comments = comment unless comment.nil?
          registration.administrative_notes = admin_comment unless admin_comment.nil?
          registration.guests = guests if guests.present?

          update_status(registration, status)

          if old_status == Registrations::Helper::STATUS_WAITING_LIST || status == Registrations::Helper::STATUS_WAITING_LIST
            waiting_list = competition.waiting_list || competition.create_waiting_list(entries: [])
            update_waiting_list(update_params[:competing], registration, old_status, waiting_list)
          end

          changes = registration.changes.transform_values { |change| change[1] }

          if waiting_list_position.present?
            changes[:waiting_list_position] = waiting_list_position
          end

          changes[:event_ids] = event_ids if event_ids.present?

          registration.save!
          if acting_user_id == 'Auto-accept'
            registration.add_history_entry(changes, 'System', acting_user_id, Registrations::Helper.action_type(update_params, acting_user_id))
          else
            registration.add_history_entry(changes, 'user', acting_user_id, Registrations::Helper.action_type(update_params, acting_user_id))
          end
        end

        send_status_change_email(registration, status, old_status, user_id, acting_user_id) if status.present? && old_status != status

        # TODO: V3-REG Cleanup Figure out a way to get rid of this reload
        registration.reload
      end

      def self.update_waiting_list(competing_params, registration, old_status, waiting_list)
        status = competing_params['status']
        waiting_list_position = competing_params['waiting_list_position']

        should_add = status == Registrations::Helper::STATUS_WAITING_LIST && registration.waiting_list_position.nil?
        should_move = waiting_list_position.present?
        should_remove = status.present? && old_status == Registrations::Helper::STATUS_WAITING_LIST &&
                        status != Registrations::Helper::STATUS_WAITING_LIST

        waiting_list.add(registration) if should_add
        waiting_list.move_to_position(registration, competing_params[:waiting_list_position].to_i) if should_move
        waiting_list.remove(registration) if should_remove
      end

      def self.update_status(registration, status)
        return unless status.present?

        registration.competing_status = status
      end

      def self.send_status_change_email(registration, status, old_status, user_id, current_user_id)
        case status
        when Registrations::Helper::STATUS_WAITING_LIST
          RegistrationsMailer.notify_registrant_of_waitlisted_registration(registration).deliver_later
        when Registrations::Helper::STATUS_PENDING
          RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
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

        update_competition_events = registration.competition.competition_events.where(event_id: event_ids)
        registration.competition_events = update_competition_events
      end
    end
  end
end
