# frozen_string_literal: true

class Api::V1::ApiController < ActionController::API
  prepend_before_action :validate_jwt_token

  # Manually include new Relic because we don't derive from ActionController::Base
  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?

  def validate_jwt_token
    auth_header = request.headers['Authorization']
    if auth_header.blank?
      return render json: { error: ErrorCodes::MISSING_AUTHENTICATION }, status: :unauthorized
    end
    token = request.headers['Authorization'].split[1]
    begin
      decoded_token = (JWT.decode token, JwtOptions.secret, true, { algorithm: JwtOptions.algorithm })[0]
      @current_user = decoded_token['user_id'].to_i
    rescue JWT::VerificationError, JWT::InvalidJtiError
      Metrics.increment('jwt_verification_error_counter')
      render json: { error: ErrorCodes::INVALID_TOKEN }, status: :unauthorized
    rescue JWT::ExpiredSignature
      render json: { error: ErrorCodes::EXPIRED_TOKEN }, status: :unauthorized
    end
  end

  def render_error(http_status, error, data = nil)
    Metrics.increment('registration_validation_errors_counter')
    if data.present?
      render json: { error: error, data: data }, status: http_status
    else
      render json: { error: error }, status: http_status
    end
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: ErrorCodes::INVALID_REQUEST_DATA }, status: :bad_request
  end
end
