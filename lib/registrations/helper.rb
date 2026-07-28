# frozen_string_literal: true

module Registrations
  module Helper
    # TODO: V3-REG Cleanup. Change to symbol when introducing the registration_status enum
    STATUS_PENDING = "pending"
    STATUS_WAITING_LIST = "waiting_list"
    STATUS_ACCEPTED = "accepted"
    # TODO: V3-REG Cleanup. Remove deleted when we switch to the competing_status enum
    STATUS_DELETED = "deleted"
    STATUS_CANCELLED = "cancelled"
    STATUS_REJECTED = "rejected"

    REGISTRATION_STATES = [STATUS_ACCEPTED, STATUS_CANCELLED, STATUS_PENDING, STATUS_REJECTED, STATUS_WAITING_LIST].freeze # TODO: Change deleted to canceled when v1 is retired
    ADMIN_ONLY_STATES = [STATUS_PENDING, STATUS_WAITING_LIST, STATUS_ACCEPTED, STATUS_REJECTED].freeze # Only admins are allowed to change registration state to one of these states

    def self.action_type(request, registration_user_id, current_user_id)
      self_updating = registration_user_id == current_user_id
      status = request.dig('competing', 'status')
      if status == STATUS_CANCELLED
        return self_updating ? 'Competitor delete' : 'Admin delete'
      end
      return 'Admin reject' if status == STATUS_REJECTED

      self_updating ? 'Competitor update' : 'Admin update'
    end

    def self.user_qualification_data(user, date)
      return [] if user.person.blank?

      # Compile singles
      best_singles_by_cutoff = user.person.best_singles_by(date)
      single_qualifications = best_singles_by_cutoff.map do |event, time|
        self.qualification_data(event, :single, time, date)
      end

      # Compile averages
      best_averages_by_cutoff = user.person&.best_averages_by(date)
      average_qualifications = best_averages_by_cutoff.map do |event, time|
        self.qualification_data(event, :average, time, date)
      end

      single_qualifications + average_qualifications
    end

    def self.qualification_data(event, type, time, date)
      raise ArgumentError.new("'type' may only contain the symbols `:single` or `:average`") unless %i[single average].include?(type)

      {
        eventId: event,
        type: type,
        best: time,
        on_or_before: date.iso8601,
      }
    end

    def self.user_for_registration!(registration_row)
      wca_id = registration_row[:wcaId]&.upcase
      email = registration_row[:email]&.downcase
      country_iso2 = registration_row[:countryIso2]

      person_details = {
        name: registration_row[:name],
        country_iso2: country_iso2,
        gender: registration_row[:gender],
        dob: registration_row[:birthdate],
      }

      if wca_id.present?
        raise I18n.t("registrations.import.errors.non_existent_wca_id", wca_id: wca_id) unless Person.exists?(wca_id: wca_id)

        user = User.find_by(wca_id: wca_id)
        if user
          if user.dummy_account?
            email_user = User.find_by(email: email)
            if email_user
              if email_user.wca_id.present?
                raise I18n.t("registrations.import.errors.email_user_with_different_wca_id",
                             email: email, user_wca_id: email_user.wca_id,
                             registration_wca_id: wca_id)
              else
                # User hooks will also remove the dummy user account.
                email_user.update!(wca_id: wca_id, **person_details)
                [email_user, false]
              end
            else
              user.skip_reconfirmation!
              user.update!(dummy_account: false, **person_details, email: email)
              [user, true]
            end
          else
            [user, false] # Use this account.
          end
        else
          email_user = User.find_by(email: email)
          if email_user
            if email_user.unconfirmed_wca_id.present? && email_user.unconfirmed_wca_id != wca_id
              raise I18n.t("registrations.import.errors.email_user_with_different_unconfirmed_wca_id",
                           email: email, unconfirmed_wca_id: email_user.unconfirmed_wca_id,
                           registration_wca_id: wca_id)
            else
              email_user.update!(wca_id: wca_id, **person_details)
              [email_user, false]
            end
          else
            # Create a locked account with confirmed WCA ID.
            [create_locked_account!(registration_row), true]
          end
        end
      else
        email_user = User.find_by(email: email)
        # Use the user if exists, otherwise create a locked account without WCA ID.
        if email_user
          if email_user.wca_id.blank?
            # If this is just a user account with no WCA ID, update its data.
            # Given it's verified by organizers, it's more trustworthy/official data (if different at all).
            email_user.update!(person_details)
          end
          [email_user, false]
        else
          [create_locked_account!(registration_row), true]
        end
      end
    end

    private_class_method def self.create_locked_account!(registration_row)
      User.new_locked_account(
        name: registration_row[:name],
        email: registration_row[:email]&.downcase,
        wca_id: registration_row[:wcaId]&.upcase,
        country_iso2: registration_row[:countryIso2],
        gender: registration_row[:gender],
        dob: registration_row[:birthdate],
      ).tap(&:save!)
    end
  end
end
