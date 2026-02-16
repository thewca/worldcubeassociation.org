# frozen_string_literal: true

class Api::V1::ApiController < ApplicationController
  prepend_before_action :require_user!

  def require_user!
    @current_user = current_user || api_user
    raise WcaExceptions::MustLogIn.new if @current_user.nil?
  end

  def require_manage!(competition)
    require_user!
    raise WcaExceptions::NotPermitted.new("Organizer privileges required") unless @current_user.can_manage_competition?(competition)
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

  # Probably nicer to have some kind of errorcode/string depending on the model
  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: e.to_s, data: { model: e.model, id: e.id } }, status: :not_found
  end

  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }.reverse_merge(e.error_details.compact)
  end
end
