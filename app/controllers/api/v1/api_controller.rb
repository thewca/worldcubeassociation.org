# frozen_string_literal: true

class Api::V1::ApiController < ActionController::API
  # https://github.com/rails/jbuilder/pull/575
  helper_method :combined_fragment_cache_key
  helper_method :view_cache_dependencies
  prepend_before_action :validate_jwt_token

  # Manually include new Relic because we don't derive from ActionController::Base
  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?

  def validate_jwt_token
    auth_header = request.headers['Authorization']
    if auth_header.blank?
      return render json: { error: Registrations::ErrorCodes::MISSING_AUTHENTICATION }, status: :unauthorized
    end
    token = auth_header.split[1]
    begin
      decode_result = JWT.decode token, AppSecrets.JWT_KEY, true, { algorithm: 'HS256' }
      decoded_token = decode_result[0]
      @current_user = User.find(decoded_token['user_id'].to_i)
    rescue JWT::VerificationError, JWT::InvalidJtiError
      render json: { error: Registrations::ErrorCodes::INVALID_TOKEN }, status: :unauthorized
    rescue JWT::ExpiredSignature
      render json: { error: Registrations::ErrorCodes::EXPIRED_TOKEN }, status: :unauthorized
    end
  end

  def render_error(http_status, error, data = nil)
    if data.present?
      render json: { error: error, data: data }, status: http_status
    else
      render json: { error: error }, status: http_status
    end
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: Registrations::ErrorCodes::INVALID_REQUEST_DATA }, status: :bad_request
  end
end
