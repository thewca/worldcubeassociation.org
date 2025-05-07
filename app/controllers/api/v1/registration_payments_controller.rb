# frozen_string_literal: true

class Api::V1::RegistrationPaymentsController < Api::V1::ApiController
  def show
    registration_id = params.require(:registration_id)
    registration = Registration.includes(:competition, registration_payments: [:refunding_registration_payments]).find(registration_id)

    return head :unauthorized unless @current_user.id == registration.user_id || @current_user.can_manage_competition?(registration.competition)

    # Use `filter` here on purpose because the whole `registration_payments` list has been included above.
    #   Using `where` would create an SQL query, but it would also break (i.e. make redundant) the `includes` call above.
    root_payments = registration.registration_payments.filter { it.refunded_registration_payment_id.nil? }
    serialized_payments = root_payments.map { it.to_v2_json(refunds: true) }

    render json: { charges: serialized_payments }
  end
end
