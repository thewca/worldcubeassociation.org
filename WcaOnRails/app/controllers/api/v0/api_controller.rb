class Api::V0::ApiController < ApplicationController
  before_action :doorkeeper_authorize!, only: [:me]

  def me
    render json: { me: current_resource_owner }
  end

  def auth_results
    if !current_devise_user
      return render status: :unauthorized, json: { error: "Please log in" }
    end
    if !current_devise_user.results_team_member?
      return render status: :forbidden, json: { error: "Must be on the results team" }
    end

    render json: { sucess: true }
  end

  def scramble_program
    render json: {
      "current": {
        "name": "TNoodle-WCA-0.9.0",
        "information": "#{root_url}regulations/scrambles/",
        "download": "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-0.9.0.jar"
      },
      "allowed": [
        "TNoodle-WCA-0.9.0"
      ],
      "history": [
        "TNoodle-0.7.4",       # 2013-01-01
        "TNoodle-0.7.5",       # 2013-02-26
        "TNoodle-0.7.8",       # 2013-04-26
        "TNoodle-0.7.12",      # 2013-10-01
        "TNoodle-WCA-0.8.0",   # 2014-01-13
        "TNoodle-WCA-0.8.1",   # 2014-01-14
        "TNoodle-WCA-0.8.2",   # 2014-01-28
        "TNoodle-WCA-0.8.4",   # 2014-02-10
        "TNoodle-WCA-0.9.0"    # 2015-03-30
      ]
    }
  end

  def help
  end

  private def current_resource_owner
    DeviseUser.find(doorkeeper_token.resource_owner_id) if doorkeeper_token
  end
end
