# frozen_string_literal: true

class Api::V1::RegistrationPaymentsController < Api::V1::ApiController
  before_action :validate_admin_action, only: %i[toggle_payment_capture]

  def validate_admin_action
    @payment = RegistrationPayment.find(params.require(:registration_payment_id))
    competition = @payment.registration.competition

    render_error(:unauthorized, Registrations::ErrorCodes::USER_INSUFFICIENT_PERMISSIONS) unless @current_user.can_manage_competition?(competition)
  end

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

  def toggle_payment_capture
    stored_record = @payment.receipt
    stored_intent = stored_record.payment_intent
    comp = @payment.registration.competition
    connected_account = comp.payment_account_for(:manual)

    if stored_record.manual_status == 'organizer_approved'
      stored_record.assign_attributes(manual_status: 'user_submitted')
    else
      stored_record.assign_attributes(manual_status: 'organizer_approved')
    end

    stored_intent.update_status_and_charges(connected_account, stored_record, current_user) do |updated_record|
      case updated_record.manual_status
      when 'organizer_approved', 'created'
        render json: @payment.to_v2_json if !@payment.is_completed? && @payment.update(is_completed: true)
      when 'user_submitted'
        render json: @payment.to_v2_json if @payment.is_completed? && @payment.update(is_completed: false)
      end
    end
  end
end
