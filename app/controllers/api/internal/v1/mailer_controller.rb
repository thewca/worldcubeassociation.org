# frozen_string_literal: true

class Api::Internal::V1::MailerController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:registration]
  def registration
    registration_status = params.require(:status)
    # Either "create" or "update", we need this to send the correct emails if organizers move
    # a competitor back to pending
    registration_action = params.require(:action)
    registration_user = params.require(:user_id)
    # So we know who to email on delete
    requesting_user = params.require(:current_user)
    registration_competition = params.require(:competition_id)
    competition = Competition.find(registration_competition)
    user = User.find(registration_user)
    converted_registration = Microservices::Registrations.convert_registration(competition, user, registration_status)

    if registration_status == 'pending' && registration_action == 'create'
      RegistrationsMailer.notify_organizers_of_new_registration(converted_registration).deliver_later
      RegistrationsMailer.notify_registrant_of_new_registration(converted_registration).deliver_later
    end

    if registration_status == 'pending' && registration_actions == 'update'
      RegistrationsMailer.notify_registrant_of_pending_registration(converted_registration).deliver_later
    end

    if registration_status == 'accepted' && registration_action == 'update'
      RegistrationsMailer.notify_registrant_of_accepted_registration(converted_registration).deliver_later
    end

    if registration_status == 'cancelled' && registration_action == 'update'
      # Only email the organizers if the user deletes themself
      if requesting_user == registration_user
        RegistrationsMailer.notify_organizers_of_deleted_registration(converted_registration).deliver_later
      else
        RegistrationsMailer.notify_registrant_of_deleted_registration(converted_registration).deliver_later
      end
    end
  end
end
