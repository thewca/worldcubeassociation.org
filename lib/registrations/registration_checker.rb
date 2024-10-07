# frozen_string_literal: true

module Registrations
  class RegistrationChecker
    COMMENT_CHARACTER_LIMIT = 240
    def self.create_registration_allowed!(registration_request, competition, requester_user)
      requestee_user = User.find(registration_request['user_id'])

      user_can_create_registration!(competition, requester_user, requestee_user)
      validate_create_events!(registration_request, competition)
      validate_qualifications!(registration_request, competition)
      validate_guests!(registration_request, competition)
      validate_comment!(registration_request, competition)
    end

    def self.update_registration_allowed!(update_request, competition, requester_user)
      requestee_user = User.find(update_request['user_id'])
      registration = Registration.find_by(competition_id: competition.id, user_id: update_request['user_id'])

      user_can_modify_registration!(competition, requester_user, requestee_user, registration)
      validate_guests!(update_request, competition)
      validate_comment!(update_request, competition, registration)
      validate_organizer_fields!(update_request)
      validate_organizer_comment!(update_request)
      validate_waiting_list_position!(update_request, competition)
      validate_update_status!(update_request, competition, requester_user, requestee_user, registration)
      validate_update_events!(update_request, competition)
      validate_qualifications!(update_request, competition)
    rescue ActiveRecord::RecordNotFound
      # We capture and convert the error so that it can be included in the error array of a bulk update request
      raise WcaExceptions::RegistrationError.new(:not_found, Registrations::ErrorCodes::REGISTRATION_NOT_FOUND)
    end

    def self.bulk_update_allowed!(bulk_update_request, competition, requesting_user)
      raise BulkUpdateError.new(:unauthorized, [Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS]) unless
        requesting_user.can_manage_competition?(competition)

      errors = {}
      bulk_update_request['requests'].each do |update_request|
        update_registration_allowed!(update_request, competition, requesting_user)
      rescue WcaExceptions::RegistrationError => e
        Rails.logger.debug { "Bulk update was rejected with error #{e.error} at #{e.backtrace[0]}" }
        errors[update_request['user_id']] = e.error
      end

      raise BulkUpdateError.new(:unprocessable_entity, errors) unless errors.empty?
    end

    class << self
      def user_can_create_registration!(competition, requester_user, requestee_user)
        # Only the user themselves can create a registration for the user
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless requester_user.id == requestee_user.id

        # Only organizers can register when registration is closed, and they can only register for themselves - not for other users
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::REGISTRATION_CLOSED) unless competition.registration_open? || organizer_modifying_own_registration?(competition, requester_user, requestee_user)

        # Users must have the necessary permissions to compete - eg, they cannot be banned or have incomplete profiles
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_CANNOT_COMPETE) unless requestee_user.cannot_register_for_competition_reasons(competition).empty?

        # Users cannot sign up for multiple competitions in a series
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if existing_registration_in_series?(competition, requestee_user)
      end

      def user_can_modify_registration!(competition, requester_user, requestee_user, registration)
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless can_administer_or_current_user?(competition, requester_user, requestee_user)
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::USER_EDITS_NOT_ALLOWED) unless competition.registration_edits_allowed? || requester_user.can_manage_competition?(competition)
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::REGISTRATION_IS_REJECTED) if user_is_rejected?(requester_user, requestee_user, registration)
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
          existing_registration_in_series?(competition, requestee_user) && !requester_user.can_manage_competition?(competition)
      end

      def user_is_rejected?(requester_user, requestee_user, registration)
        requester_user.id == requestee_user.id && registration.rejected?
      end

      def organizer_modifying_own_registration?(competition, requester_user, requestee_user)
        requester_user.can_manage_competition?(competition) && (requester_user.id == requestee_user.id)
      end

      def can_administer_or_current_user?(competition, requester_user, requestee_user)
        # Only an organizer or the user themselves can create a registration for the user
        # One case where organizers need to create registrations for users is if a 3rd-party registration system is being used, and registration data is being
        # passed to the Registration Service from it
        (requester_user.id == requestee_user.id) || requester_user.can_manage_competition?(competition)
      end

      def validate_create_events!(request, competition)
        event_ids = request['competing']['event_ids']
        # Event submitted must be held at the competition
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_EVENT_SELECTION) unless competition.events_held?(event_ids)

        event_limit = competition.events_per_registration_limit
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::INVALID_EVENT_SELECTION) if event_limit.present? && event_ids.count > event_limit
      end

      def validate_qualifications!(request, competition)
        return unless competition.enforces_qualifications?
        event_ids = request.dig('competing', 'event_ids')

        unqualified_events = event_ids.filter_map do |event|
          qualification = competition.qualification_wcif[event]
          event if qualification.present? && !competitor_qualifies_for_event?(event, qualification)
        end

        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::QUALIFICATION_NOT_MET, unqualified_events) unless unqualified_events.empty?
      end

      def validate_guests!(request, competition)
        return if (guests = request['guests'].to_i).nil?

        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_REQUEST_DATA) if guests < 0
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, ErrorCodes::GUEST_LIMIT_EXCEEDED) if competition.guest_limit_exceeded?(guests)
      end

      def validate_comment!(request, competition, registration = nil)
        if (comment = request.dig('competing', 'comment')).nil?
          # Return if no comment was supplied in the request but one already exists for the registration
          return if registration.present? && !registration.comments.nil? && !(registration.comments == '')

          # Raise error if comment is mandatory, none has been supplied, and none exists for the registration
          raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::REQUIRED_COMMENT_MISSING) if competition.force_comment_in_registration
        else
          raise WcaExceptions::RegistrationError.new(:unprocessable_entity, ErrorCodes::USER_COMMENT_TOO_LONG) if comment.length > COMMENT_CHARACTER_LIMIT
          raise WcaExceptions::RegistrationError.new(:unprocessable_entity, ErrorCodes::REQUIRED_COMMENT_MISSING) if competition.force_comment_in_registration && comment == ''
        end
      end

      def validate_organizer_fields!(request)
        organizer_fields = ['organizer_comment', 'waiting_list_position']

        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) if contains_organizer_fields?(request, organizer_fields) && !requester_user.can_manage_competition?(competition)
      end

      def validate_organizer_comment!(request)
        organizer_comment = request.dig('competing', 'organizer_comment')
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::USER_COMMENT_TOO_LONG) if
          !organizer_comment.nil? && organizer_comment.length > COMMENT_CHARACTER_LIMIT
      end

      def validate_waiting_list_position!(request, competition)
        return if (waiting_list_position = request.dig('competing', 'waiting_list_position')).nil?

        # Floats are not allowed
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION) if waiting_list_position.is_a? Float

        # We convert strings to integers and then check if they are an integer
        converted_position = Integer(waiting_list_position, exception: false)
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION) unless converted_position.is_a? Integer

        waiting_list = competition.waiting_list.entries
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION) if waiting_list.empty? && converted_position != 1
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION) if converted_position > waiting_list.length
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::INVALID_WAITING_LIST_POSITION) if converted_position < 1
      end

      def contains_organizer_fields?(request, organizer_fields)
        request['competing']&.keys&.any? { |key| organizer_fields.include?(key) }
      end

      def validate_update_status!(request, competition, requester_user, requestee_user, registration)
        return if (new_status = request.dig('competing', 'status')).nil?

        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_REQUEST_DATA) unless Registrations::Helper::REGISTRATION_STATES.include?(new_status)
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::COMPETITOR_LIMIT_REACHED) if
          new_status == 'accepted' && Registration.accepted.count == competition.competitor_limit
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
          new_status == 'accepted' && existing_registration_in_series?(competition, requestee_user)

        # Otherwise, organizers can make any status change they want to
        return if requester_user.can_manage_competition?(competition)

        # A user (ie not an organizer) is only allowed to:
        # 1. Reactivate their registration if they previously cancelled it (ie, change status from 'cancelled' to 'pending')
        # 2. Cancel their registration, assuming they are allowed to cancel

        # User reactivating registration
        if new_status == 'pending'
          raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless registration.cancelled?
          return # No further checks needed if status is pending
        end

        # Now that we've checked the 'pending' case, raise an error is the status is not cancelled (cancelling is the only valid action remaining)
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) if new_status != 'cancelled'

        # Raise an error if competition prevents users from cancelling a registration once it is accepted
        raise WcaExceptions::RegistrationError.new(:unauthorized, Registrations::ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION) if
          !competition.allow_registration_self_delete_after_acceptance && registration.accepted?

        # Users aren't allowed to change events when cancelling
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_REQUEST_DATA) if
          request['competing'].key?('event_ids') && registration.event_ids != request['competing']['event_ids']
      end

      def validate_update_events!(request, competition)
        return if (event_ids = request.dig('competing', 'event_ids')).nil?
        raise WcaExceptions::RegistrationError.new(:unprocessable_entity, Registrations::ErrorCodes::INVALID_EVENT_SELECTION) unless competition.events_held?(event_ids)

        event_limit = competition.events_per_registration_limit
        raise WcaExceptions::RegistrationError.new(:forbidden, Registrations::ErrorCodes::INVALID_EVENT_SELECTION) if event_limit.present? && event_ids.count > event_limit
      end

      def existing_registration_in_series?(competition, requestee_user)
        other_series_ids = competition.other_series_ids
        return false if other_series_ids.nil?

        other_series_ids.each do |comp_id|
          series_reg = Registration.find_by(competition_id: comp_id, user_id: requestee_user.id)
          if series_reg.nil?
            next
          end
          return series_reg.might_attend?
        end
        false
      end

      def competitor_qualifies_for_event?(event, qualification, requestee_user)
        competitor_qualification_results = UserApi.qualifications(requestee_user, qualification['whenDate'])
        result_type = qualification['resultType']

        competitor_pr = competitor_qualification_results.find { |result| result['eventId'] == event && result['type'] == result_type }
        return false if competitor_pr.blank?

        begin
          pr_date = Date.parse(competitor_pr['on_or_before'])
          qualification_date = Date.parse(qualification['whenDate'])
        rescue ArgumentError
          return false
        end

        return false unless pr_date <= qualification_date

        case qualification['type']
        when 'anyResult', 'ranking'
          # By this point the user definitely has a result.
          # Ranking qualifications are enforced when registration closes, so it is effectively an anyResult ranking when registering
          true
        when 'attemptResult'
          competitor_pr['best'].to_i < qualification['level']
        else
          false
        end
      end
    end
  end
end
