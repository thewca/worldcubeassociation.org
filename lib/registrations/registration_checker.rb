# frozen_string_literal: true

module Registrations
  class RegistrationChecker
    def self.apply_payload(registration, raw_payload)
      # Duplicate everything to make sure we don't trigger unwanted DB write operations
      registration.deep_dup.tap do |new_registration|
        guests = raw_payload['guests']

        new_registration.guests = guests.to_i if raw_payload.key?('guests')

        competing_payload = raw_payload['competing']
        comment = competing_payload&.dig('comment')
        organizer_comment = competing_payload&.dig('organizer_comment')
        competing_status = competing_payload&.dig('status')

        new_registration.comments = comment if competing_payload&.key?('comment')
        new_registration.administrative_notes = organizer_comment if competing_payload&.key?('organizer_comment')
        new_registration.competing_status = competing_status if competing_payload&.key?('status')

        # Since even deep cloning does not take care of associations, we must fall back to the original registration.
        #   Otherwise, every payload that does not specify `event_ids` would trigger "must register for >= 1 event"
        desired_events = competing_payload&.dig('event_ids') || registration.event_ids
        new_registration.tracked_event_ids = registration.event_ids

        competition_events_lookup = registration.competition.competition_events.where(event_id: desired_events).index_by(&:event_id)
        competition_events = desired_events.map { competition_events_lookup[it]&.deep_dup }

        upserted_competition_events = competition_events.map { new_registration.registration_competition_events.build(competition_event: it) }
        new_registration.registration_competition_events = upserted_competition_events
      end
    end

    def self.create_registration_allowed!(registration_request, target_user, competition)
      registration = Registration.new(competition: competition, user: target_user)
      registration = self.apply_payload(registration, registration_request)

      # Migrated to ActiveRecord-style validations
      validate_guests!(registration)
      validate_comment!(registration)
      validate_registration_events!(registration)
    end

    def self.update_registration_allowed!(update_request, registration)
      waiting_list_position = update_request.dig('competing', 'waiting_list_position')

      updated_registration = self.apply_payload(registration, update_request)

      # Migrated to ActiveRecord-style validations
      validate_guests!(updated_registration)
      validate_comment!(updated_registration)
      validate_organizer_comment!(updated_registration)
      validate_registration_events!(updated_registration)
      validate_status_value!(updated_registration)

      # Old-style validations within this class
      validate_waiting_list_position!(updated_registration) unless waiting_list_position.nil?
    end

    class << self
      def validate_registration_events!(registration)
        process_nested_validation_error!(registration, :registration_competition_events, :competition_event) { it.event_id }
        process_validation_error!(registration, :registration_competition_events)
        process_validation_error!(registration, :competition_events)
      end

      def process_validation_error!(registration, field)
        return if registration.valid?

        error_details = registration.errors.details[field]&.first

        return if error_details.blank?

        frontend_code = error_details[:frontend_code] || Registrations::ErrorCodes::INVALID_REQUEST_DATA
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, frontend_code, error_details)
      end

      def process_nested_validation_error!(registration, association, field)
        return if registration.valid?

        grouped_error_details = registration.public_send(association)
                                            .reject { it.valid? }
                                            .index_with { it.errors.details[field]&.presence }
                                            .compact

        return if grouped_error_details.empty?

        # Re-key: From { obj: [error1, error2, error3] } to { error1: { obj: error }, error2: { obj, error }, error3: { obj: error } }
        objects_by_error = grouped_error_details.flat_map { |obj, errors| errors.map { |err| [err.slice(:error, :frontend_code), obj, err] } }
                                                .group_by { |meta, _obj, _err| meta }
                                                .transform_values { it.to_h { |_meta, obj, err| [obj, err] } }

        # Just like in the single-property case above, we throw an error about the first thing that we stumble upon
        error_details, errored_entities = objects_by_error.first

        errored_entities = errored_entities.keys
        # Transform for better readability, if the user so desires
        errored_entities = errored_entities.map { yield it } if block_given?

        frontend_code = error_details[:frontend_code] || Registrations::ErrorCodes::INVALID_REQUEST_DATA
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, frontend_code, errored_entities)
      end

      def validate_guests!(registration)
        process_validation_error!(registration, :guests)
      end

      def validate_comment!(registration)
        process_validation_error!(registration, :comments)
      end

      def validate_organizer_comment!(registration)
        process_validation_error!(registration, :administrative_notes)
      end

      def validate_waiting_list_position!(registration)
        # User must be on the wating list
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_REQUEST_DATA) unless
         registration.competing_status == Registrations::Helper::STATUS_WAITING_LIST
      end

      def validate_status_value!(registration)
        process_validation_error!(registration, :competing_status)
        process_validation_error!(registration, :competition_id)
      end
    end
  end
end
