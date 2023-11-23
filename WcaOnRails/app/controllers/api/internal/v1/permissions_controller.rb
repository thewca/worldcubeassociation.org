# frozen_string_literal: true

class Api::Internal::V1::PermissionsController < Api::Internal::V1::ApiController
  def index
    user_id = params.require(:id)
    user = User.find(user_id)
    render json: user.permissions
  end
end
