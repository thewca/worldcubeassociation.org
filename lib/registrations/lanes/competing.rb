# frozen_string_literal: true

module Registrations
  module Lanes
    module Competing
      def self.process!(lane_params, user_id, competition_id)
        registration = Registration.build(competition_id: competition_id,
                                          user_id: user_id,
                                          registered_at: Time.now.utc)

        # Apply all the information passed in by the user
        registration = Registrations::RegistrationChecker.apply_payload(registration, lane_params)

        changes = registration.changes.transform_values { |change| change[1] }
        changes[:event_ids] = registration.changed_event_ids

        registration.save!

        RegistrationsMailer.notify_organizers_of_new_registration(registration).deliver_later
        RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
        RegistrationsMailer.notify_delegates_of_formerly_banned_user_registration(registration).deliver_later if registration.user.banned_in_past?
        registration.add_history_entry(changes, "worker", user_id, "Worker processed")
      end

      def self.update!(update_params, competition, current_user_id)
        status = update_params.dig('competing', 'status')
        waiting_list_position = update_params.dig('competing', 'waiting_list_position')
        user_id = update_params[:user_id]

        registration = Registration.find_by(competition: competition, user_id: user_id)
        registration = Registrations::RegistrationChecker.apply_payload(registration, update_params)

        old_status = registration.competing_status

        ActiveRecord::Base.transaction do
          if old_status == Registrations::Helper::STATUS_WAITING_LIST || status == Registrations::Helper::STATUS_WAITING_LIST
            waiting_list = competition.waiting_list || competition.create_waiting_list(entries: [])
            update_waiting_list(update_params[:competing], registration, old_status, waiting_list)
          end

          changes = registration.changes.transform_values { |change| change[1] }

          changes[:waiting_list_position] = waiting_list_position if waiting_list_position.present?
          changes[:event_ids] = registration.changed_event_ids if registration.changed_event_ids.present?

          registration.save!
          registration.add_history_entry(changes, 'user', current_user_id, Registrations::Helper.action_type(update_params, current_user_id))
        end

        send_status_change_email(registration, current_user_id) if registration.competing_status_previously_changed?

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

      def self.send_status_change_email(registration, current_user_id)
        case registration.status
        when Registrations::Helper::STATUS_WAITING_LIST
          RegistrationsMailer.notify_registrant_of_waitlisted_registration(registration).deliver_later
        when Registrations::Helper::STATUS_PENDING
          RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
        when Registrations::Helper::STATUS_ACCEPTED
          RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
        when Registrations::Helper::STATUS_REJECTED, Registrations::Helper::STATUS_DELETED, Registrations::Helper::STATUS_CANCELLED
          if registration.user_id == current_user_id
            RegistrationsMailer.notify_organizers_of_deleted_registration(registration).deliver_later
          else
            RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
          end
        else
          raise "Unknown registration status, this should not happen"
        end
      end
    end
  end
end
