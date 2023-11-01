# frozen_string_literal: true

class Api::V0::UsersController < Api::V0::ApiController
  def token
    if current_user
      render json: { status: "ok" }
    else
      render status: :unauthorized, json: { error: "Please log in" }
    end
  end
end
