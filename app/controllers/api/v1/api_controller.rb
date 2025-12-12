# frozen_string_literal: true

class Api::V1::ApiController < ApplicationController
  prepend_before_action :require_user

  def require_user
    @current_user = current_user || api_user
    raise WcaExceptions::MustLogIn.new if @current_user.nil?
  end

  def api_user
    User.find_by(id: doorkeeper_token&.resource_owner_id) if doorkeeper_token&.accessible?
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
end
