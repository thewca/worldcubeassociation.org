# frozen_string_literal: true

class ApiErrorsController < ApplicationController
  skip_before_action :set_locale
  skip_before_action :store_user_location!
  def show
    exception = request.env["action_dispatch.exception"]
    status_code = ActionDispatch::ExceptionWrapper.new(request.env, exception).status_code
    request_id = request.env["action_dispatch.request_id"]
    render json: { error_code: status_code, request_id: request_id, contact_url: Rails.application.routes.url_helpers.contact_url(contactRecipient: 'wst', requestId: request_id) }, status: status_code
  end
end
