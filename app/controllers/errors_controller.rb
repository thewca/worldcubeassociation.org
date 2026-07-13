# frozen_string_literal: true

class ErrorsController < ApplicationController
  layout "application"

  def show
    @exception = request.env["action_dispatch.exception"]
    @status_code = ActionDispatch::ExceptionWrapper.new(request.env, @exception).status_code
    @request_id = request.env["action_dispatch.request_id"]

    return render_api_error(@status_code, @request_id) if api_request?

    if @exception.instance_of?(ActiveRecord::RecordNotFound) && @exception.model == "Competition"
      @id = params['id']
      render 'competition_not_found', status: :not_found
    elsif @exception.instance_of?(ActionController::InvalidAuthenticityToken)
      render 'session_expired', status: :unprocessable_content
    else
      render error_page(@status_code), status: @status_code
    end
  end

  private

    def api_request?
      EnvConfig.API_ONLY? || original_path.start_with?("/api/")
    end

    def original_path
      request.env["action_dispatch.original_path"] || request.path
    end

    def render_api_error(status_code, request_id)
      render json: { error_code: status_code,
                     request_id: request_id,
                     contact_url: Rails.application.routes.url_helpers.contact_url(contactRecipient: 'wst', requestId: request_id) },
             status: status_code
    end

    def error_page(code)
      supported_error_codes.fetch(code, "404")
    end

    def supported_error_codes
      {
        500 => "500",
        501 => "500",
        502 => "500",
      }
    end
end
