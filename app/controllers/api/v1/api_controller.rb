# frozen_string_literal: true

class Api::V1::ApiController < ActionController::API
  prepend_before_action :validate_jwt_token
  before_action :snake_case_params!
  skip_before_action :validate_jwt_token, only: [:test_snake_case]

  # Manually include new Relic because we don't derive from ActionController::Base
  include NewRelic::Agent::Instrumentation::ControllerInstrumentation if Rails.env.production?

  def validate_jwt_token
    auth_header = request.headers['Authorization']
    return render json: { error: Registrations::ErrorCodes::MISSING_AUTHENTICATION }, status: :unauthorized if auth_header.blank?

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

  def render_with_camel_case(payload)
    render json: camelize_keys(payload)
  end

  private def camelize_keys(payload)
    case payload
    when Array
      payload.map { camelize_keys(it) }
    when Hash
      payload.transform_keys { it.to_s.camelize(:lower) }
             .transform_values { camelize_keys(it) }
    else
      payload
    end
  end

  def render_error(http_status, error, data = nil)
    if data.present?
      render json: { error: error, data: data }, status: http_status
    else
      render json: { error: error }, status: http_status
    end
  end

  rescue_from ActionController::ParameterMissing do |_e|
    render json: { error: Registrations::ErrorCodes::INVALID_REQUEST_DATA }, status: :bad_request
  end

  def test_snake_case
    return head :not_found if Rails.env.production? && EnvConfig.WCA_LIVE_SITE?

    params.delete(:action)
    params.delete(:api) # TODO: ChatGPT claims I shouldn't be getting this key - but for now I'm just trying to get the tests passing
    params.delete(:controller)
    render json: params.to_unsafe_h
  end

  private def snake_case_params!
    # TODO: Apparently if the endpoint gets given a JSON array, it puts it in a _json param - I want to research this more, for now, this gets tests passing
    if params[:_json].is_a?(Array)
      params[:_json].map! { it.deep_transform_keys(&:underscore) }
    else
      params.deep_transform_keys!(&:underscore)
    end
  end

end
