# frozen_string_literal: true

class Api::Internal::V1::MailersController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:registration]
  def registration
    registration_status = params.require(:registration_status)
    # Either "create" or "update", we need this to send the correct emails if organizers move
    # a competitor back to pending
    registration_action = params.require(:registration_action)
    registration_user = params.require(:user_id)
    # So we know who to email on delete
    requesting_user = params.require(:current_user)
    registration_competition = params.require(:competition_id)
    user = User.find(registration_user)
    registration = user.find_ms_registration_by(competition_id: registration_competition)

    if registration_status == 'pending' && registration_action == 'create'
      RegistrationsMailer.notify_organizers_of_new_registration(registration).deliver_later
      RegistrationsMailer.notify_registrant_of_new_registration(registration).deliver_later
      return render json: { emails_sent: 2 }
    end

    if registration_status == 'pending' && registration_action == 'update'
      RegistrationsMailer.notify_registrant_of_pending_registration(registration).deliver_later
      return render json: { emails_sent: 1 }
    end

    if registration_status == 'accepted' && registration_action == 'update'
      RegistrationsMailer.notify_registrant_of_accepted_registration(registration).deliver_later
      return render json: { emails_sent: 1 }
    end

    if registration_status == 'cancelled' && registration_action == 'update'
      # Only email the organizers if the user deletes themself
      if requesting_user == registration_user
        RegistrationsMailer.notify_organizers_of_deleted_registration(registration).deliver_later
      else
        RegistrationsMailer.notify_registrant_of_deleted_registration(registration).deliver_later
      end
      return render json: { emails_sent: 1 }
    end

    render json: { emails_sent: 0 }
  end
end
