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

        if old_status == Registrations::Helper::STATUS_WAITING_LIST || status == Registrations::Helper::STATUS_WAITING_LIST
          waiting_list = competition.waiting_list || competition.waiting_list.build(entries: [])
        end

        ActiveRecord::Base.transaction do
          update_status(registration, status)
          registration.comments = comment if comment.present?
          registration.administrative_notes = admin_comment if admin_comment.present?
          registration.guests = guests if guests.present?

          changes = registration.changes.transform_values { |change| change[1] }

          if waiting_list_position.present?
            waiting_list.move_to_position(user_id, waiting_list_position)
            changes[:waiting_list_position] = waiting_list_position
          end

          update_event_ids(registration, event_ids)
          changes[:event_ids] = event_ids if event_ids.present?

          registration.save!
          registration.add_history_entry(changes, 'user', current_user_id, Registrations::Helper.action_type(update_params, current_user_id))
        end

        send_status_change_email(registration, status, user_id, current_user_id) if status.present? && old_status != status

        # TODO: V3-REG Cleanup Figure out a way to get rid of this reload
        registration.reload
      end

      def self.update_status(registration, status)
        return unless status.present?

        registration.accepted_at = nil
        registration.deleted_at = nil
        registration.rejected_at = nil
        registration.waitlisted_at = nil

        case status
        when Registrations::Helper::STATUS_WAITING_LIST
          registration.waitlisted_at = Time.now.utc
        when Registrations::Helper::STATUS_ACCEPTED
          registration.accepted_at = Time.now.utc
        when Registrations::Helper::STATUS_DELETED, Registrations::Helper::STATUS_CANCELLED
          registration.deleted_at = Time.now.utc
        when Registrations::Helper::STATUS_REJECTED
          registration.rejected_at = Time.now.utc
        when Registrations::Helper::STATUS_PENDING
          # Pending means we set nothing
        else
          raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_REQUEST_DATA)
        end
      end

      def self.send_status_change_email(registration, status, user_id, current_user_id)
        # TODO: V3-REG Cleanup, at new waiting list email
        case status
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
