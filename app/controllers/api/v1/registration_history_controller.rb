# frozen_string_literal: true

class Api::V1::RegistrationHistoryController < Api::V1::ApiController
  def show
    registration_id = params.require(:registration_id)
    registration = Registration.find(registration_id)

    return head :unauthorized unless @current_user.id == registration.user_id || @current_user.can_manage_competition?(registration.competition)

    render json: registration.registration_history
  end
end
