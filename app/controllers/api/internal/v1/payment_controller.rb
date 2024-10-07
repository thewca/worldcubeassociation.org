# frozen_string_literal: true

class Api::Internal::V1::PaymentController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:init_stripe]

  def init_stripe
    attendee_id = params.require(:attendee_id)
    competition_id, registering_user_id = attendee_id.split("-")

    paying_user_id = params.require(:current_user)
    paying_user = User.find(paying_user_id)

    return render json: { error: "Paying user not found" }, status: :not_found unless paying_user.present?
    return render json: { error: "This user can't pay for this registration" }, status: :forbidden unless paying_user_id.to_i == registering_user_id.to_i

    competition = Competition.find(competition_id)
    return render json: { error: "Competition not found" }, status: :not_found unless competition.present?

    ms_registration = competition.microservice_registrations
                                 .includes(:competition, :user)
                                 .find_by(user_id: registering_user_id)

    return render json: { error: "Registration not found" }, status: :not_found unless ms_registration.present?

    payment_account = competition.payment_account_for(:stripe)

    amount_iso = params.require(:amount)
    currency_iso = params.require(:currency_code)

    payment_intent = payment_account.prepare_intent(ms_registration, amount_iso, currency_iso, paying_user)

    render json: { id: payment_intent.id, client_secret: payment_intent.client_secret }
  end
end
