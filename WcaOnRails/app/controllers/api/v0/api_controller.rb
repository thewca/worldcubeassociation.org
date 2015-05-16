class Api::V0::ApiController < ApplicationController
  before_action :doorkeeper_authorize!, except: :auth_results

  def me
    render json: { me: current_resource_owner }
  end

  def auth_results
    if !current_devise_user
      return render status: :unauthorized, text: "Please log in"
    end
    if !current_devise_user.results_team_member?
      return render status: :forbidden, text: "Must be on the results team"
    end

    render json: { sucess: true }
  end

  private def current_resource_owner
    DeviseUser.find(doorkeeper_token.resource_owner_id) if doorkeeper_token
  end
end
