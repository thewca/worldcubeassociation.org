# frozen_string_literal: true

module Registrations
  class RegistrationChecker
    COMMENT_CHARACTER_LIMIT = 240
    def self.create_registration_allowed!(registration_request, competition_info, requesting_user)
      @request = registration_request.stringify_keys
      @competition_info = competition_info
      @requestee_user_id = @request['user_id']
      @requester_user_id = requesting_user

      user_can_create_registration!
      validate_create_events!
      validate_qualifications!
      validate_guests!
      validate_comment!
    end

    def self.update_registration_allowed!(update_request, competition_info, requesting_user)
      @request = update_request.stringify_keys
      @competition_info = competition_info
      @requestee_user_id = @request['user_id']
      @requester_user_id = requesting_user
      @registration = Registration.find_by(competition_id: competition_info.id, user_id: update_request['user_id'])

      user_can_modify_registration!
      validate_guests!
      validate_comment!
      validate_organizer_fields!
      validate_organizer_comment!
      validate_waiting_list_position!
      validate_update_status!
      validate_update_events!
      validate_qualifications!
    rescue ActiveRecord::RecordNotFound
      # We capture and convert the error so that it can be included in the error array of a bulk update request
      raise RegistrationError.new(:not_found, ErrorCodes::REGISTRATION_NOT_FOUND)
    end

    def self.bulk_update_allowed!(bulk_update_request, competition_info, requesting_user)
      @competition_info = competition_info

      raise BulkUpdateError.new(:unauthorized, [ErrorCodes::USER_INSUFFICIENT_PERMISSIONS]) unless
        UserApi.can_administer?(requesting_user, competition_info.id)

      errors = {}
      bulk_update_request['requests'].each do |update_request|
        update_registration_allowed!(update_request, competition_info, requesting_user)
      rescue RegistrationError => e
        Rails.logger.debug { "Bulk update was rejected with error #{e.error} at #{e.backtrace[0]}" }
        errors[update_request['user_id']] = e.error
      end

      raise BulkUpdateError.new(:unprocessable_entity, errors) unless errors.empty?
    end

    class << self
      def user_can_create_registration!
        # Only an organizer or the user themselves can create a registration for the user
        raise RegistrationError.new(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @requester_user_id == @requestee_user_id

        # Only organizers can register when registration is closed, and they can only register for themselves - not for other users
        raise RegistrationError.new(:forbidden, ErrorCodes::REGISTRATION_CLOSED) unless @competition_info.registration_open? || organizer_modifying_own_registration?

        # Users must have the necessary permissions to compete - eg, they cannot be banned or have incomplete profiles
        can_compete = UserApi.can_compete?(@requestee_user_id, @competition_info.start_date)
        raise RegistrationError.new(:unauthorized, ErrorCodes::USER_CANNOT_COMPETE) unless can_compete

        # Users cannot sign up for multiple competitions in a series
        raise RegistrationError.new(:forbidden, ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if existing_registration_in_series?
      end

      def user_can_modify_registration!
        raise RegistrationError.new(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless can_administer_or_current_user?
        raise RegistrationError.new(:forbidden, ErrorCodes::USER_EDITS_NOT_ALLOWED) unless @competition_info.registration_edits_allowed? || UserApi.can_administer?(@requester_user_id, @competition_info.id)
        raise RegistrationError.new(:unauthorized, ErrorCodes::REGISTRATION_IS_REJECTED) if user_is_rejected?
        raise RegistrationError.new(:forbidden, ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
          existing_registration_in_series? && !UserApi.can_administer?(@requester_user_id, @competition_info.id)
      end

      def user_is_rejected?
        @requester_user_id == @requestee_user_id && @registration.competing_status == 'rejected'
      end

      def organizer_modifying_own_registration?
        @competition_info.is_organizer_or_delegate?(@requester_user_id) && (@requester_user_id == @requestee_user_id)
      end

      def can_administer_or_current_user?
        # Only an organizer or the user themselves can create a registration for the user
        # One case where organizers need to create registrations for users is if a 3rd-party registration system is being used, and registration data is being
        # passed to the Registration Service from it
        (@requester_user_id == @requestee_user_id) || UserApi.can_administer?(@requester_user_id, @competition_info.id)
      end

      def validate_create_events!
        event_ids = @request['competing']['event_ids']
        # Event submitted must be held at the competition
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_EVENT_SELECTION) unless @competition_info.events_held?(event_ids)

        event_limit = @competition_info.event_limit
        raise RegistrationError.new(:forbidden, ErrorCodes::INVALID_EVENT_SELECTION) if event_limit.present? && event_ids.count > event_limit
      end

      def validate_qualifications!
        return unless @competition_info.enforces_qualifications?
        # TODO: Read the request payload in as an object, and handle cases where expected values aren't found
        event_ids = @request.dig('competing', 'event_ids')

        unqualified_events = event_ids.filter_map do |event|
          qualification = @competition_info.get_qualification_for(event)
          event if qualification.present? && !competitor_qualifies_for_event?(event, qualification)
        end

        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::QUALIFICATION_NOT_MET, unqualified_events) unless unqualified_events.empty?
      end

      def validate_guests!
        return if (guests = @request['guests'].to_i).nil?

        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_REQUEST_DATA) if guests < 0
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::GUEST_LIMIT_EXCEEDED) if @competition_info.guest_limit_exceeded?(guests)
      end

      def validate_comment!
        if (comment = @request.dig('competing', 'comment')).nil?
          # Return if no comment was supplied in the request but one already exists for the registration
          return if @registration.present? && !@registration.comment.nil? && !(@registration.comment == '')

          # Raise error if comment is mandatory, none has been supplied, and none exists for the registration
          raise RegistrationError.new(:unprocessable_entity, ErrorCodes::REQUIRED_COMMENT_MISSING) if @competition_info.force_comment?
        else
          raise RegistrationError.new(:unprocessable_entity, ErrorCodes::USER_COMMENT_TOO_LONG) if comment.length > COMMENT_CHARACTER_LIMIT
          raise RegistrationError.new(:unprocessable_entity, ErrorCodes::REQUIRED_COMMENT_MISSING) if @competition_info.force_comment? && comment == ''
        end
      end

      def validate_organizer_fields!
        @organizer_fields = ['organizer_comment', 'waiting_list_position']

        raise RegistrationError.new(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) if contains_organizer_fields? && !UserApi.can_administer?(@requester_user_id, @competition_info.id)
      end

      def validate_organizer_comment!
        organizer_comment = @request.dig('competing', 'organizer_comment')
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::USER_COMMENT_TOO_LONG) if
          !organizer_comment.nil? && organizer_comment.length > COMMENT_CHARACTER_LIMIT
      end

      def validate_waiting_list_position!
        return if (waiting_list_position = @request.dig('competing', 'waiting_list_position')).nil?

        # Floats are not allowed
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_WAITING_LIST_POSITION) if waiting_list_position.is_a? Float

        # We convert strings to integers and then check if they are an integer
        converted_position = Integer(waiting_list_position, exception: false)
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_WAITING_LIST_POSITION) unless converted_position.is_a? Integer

        waiting_list = @competition_info.waiting_list.entries
        raise RegistrationError.new(:forbidden, ErrorCodes::INVALID_WAITING_LIST_POSITION) if waiting_list.empty? && converted_position != 1
        raise RegistrationError.new(:forbidden, ErrorCodes::INVALID_WAITING_LIST_POSITION) if converted_position > waiting_list.length
        raise RegistrationError.new(:forbidden, ErrorCodes::INVALID_WAITING_LIST_POSITION) if converted_position < 1
      end

      def contains_organizer_fields?
        @request['competing']&.keys&.any? { |key| @organizer_fields.include?(key) }
      end

      def validate_update_status!
        return if (new_status = @request.dig('competing', 'status')).nil?
        current_status = @registration.competing_status

        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_REQUEST_DATA) unless RegistrationHelper::REGISTRATION_STATES.include?(new_status)
        raise RegistrationError.new(:forbidden, ErrorCodes::COMPETITOR_LIMIT_REACHED) if
          new_status == 'accepted' && Competition.accepted_competitors_count(@competition_info.competition_id) == @competition_info.competitor_limit
        raise RegistrationError.new(:forbidden, ErrorCodes::ALREADY_REGISTERED_IN_SERIES) if
          new_status == 'accepted' && existing_registration_in_series?

        # Otherwise, organizers can make any status change they want to
        return if UserApi.can_administer?(@requester_user_id, @competition_info.id)

        # A user (ie not an organizer) is only allowed to:
        # 1. Reactivate their registration if they previously cancelled it (ie, change status from 'cancelled' to 'pending')
        # 2. Cancel their registration, assuming they are allowed to cancel

        # User reactivating registration
        if new_status == 'pending'
          raise RegistrationError.new(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless current_status == 'cancelled'
          return # No further checks needed if status is pending
        end

        # Now that we've checked the 'pending' case, raise an error is the status is not cancelled (cancelling is the only valid action remaining)
        raise RegistrationError.new(:unauthorized, ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) if new_status != 'cancelled'

        # Raise an error if competition prevents users from cancelling a registration once it is accepted
        raise RegistrationError.new(:unauthorized, ErrorCodes::ORGANIZER_MUST_CANCEL_REGISTRATION) if
          !@competition_info.user_can_cancel? && current_status == 'accepted'

        # Users aren't allowed to change events when cancelling
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_REQUEST_DATA) if
          @request['competing'].key?('event_ids') && @registration.event_ids != @request['competing']['event_ids']
      end

      def validate_update_events!
        return if (event_ids = @request.dig('competing', 'event_ids')).nil?
        raise RegistrationError.new(:unprocessable_entity, ErrorCodes::INVALID_EVENT_SELECTION) if !@competition_info.events_held?(event_ids)

        event_limit = @competition_info.event_limit
        raise RegistrationError.new(:forbidden, ErrorCodes::INVALID_EVENT_SELECTION) if event_limit.present? && event_ids.count > event_limit
      end

      def existing_registration_in_series?
        return false if @competition_info.other_series_ids.nil?

        @competition_info.other_series_ids.each do |comp_id|
          series_reg = Registration.find_by(competition_id: comp_id, user_id: @requestee_user_id)
          if series_reg.nil?
            next
          end
          return series_reg.might_attend?
        end
        false
      end

      def competitor_qualifies_for_event?(event, qualification)
        competitor_qualification_results = UserApi.qualifications(@requestee_user_id, qualification['whenDate'])
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
