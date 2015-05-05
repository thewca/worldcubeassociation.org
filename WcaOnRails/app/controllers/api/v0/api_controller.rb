class Api::V0::ApiController < ApplicationController
  before_action :doorkeeper_authorize!

  def me
    render json: { me: current_resource_owner }
  end

  private def current_resource_owner
    DeviseUser.find(doorkeeper_token.resource_owner_id) if doorkeeper_token
  end
end
