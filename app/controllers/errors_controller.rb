# frozen_string_literal: true

class ErrorsController < ApplicationController
  layout "application"

  def show
    @exception = request.env["action_dispatch.exception"]
    @status_code = ActionDispatch::ExceptionWrapper.new(request.env, @exception).status_code
    @request_id = request.env["action_dispatch.request_id"]

    if @exception.class == ActiveRecord::RecordNotFound && @exception.model == "Competition"
      @id = params['id']
      render 'competition_not_found'
    elsif @exception.class == ActionController::InvalidAuthenticityToken
      render 'session_expired'
    else
      render error_page(@status_code), status: @status_code
    end
  end

  private

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
