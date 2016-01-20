class Api::V0::ApiController < ApplicationController
  before_filter :cors_set_access_control_headers
  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, PUT, DELETE, GET, OPTIONS'
    headers['Access-Control-Request-Method'] = '*'
    headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    headers['Access-Control-Allow-Credentials'] = 'false'
  end

  before_filter :doorkeeper_authorize!, only: [:me]

  DEFAULT_API_RESULT_LIMIT = 20

  def me
    current_resource_owner = User.find(doorkeeper_token.resource_owner_id)
    render json: { me: current_resource_owner.to_jsonable(doorkeeper_token: doorkeeper_token) }
  end

  def auth_results
    if !current_user
      return render status: :unauthorized, json: { error: "Please log in" }
    end
    if !current_user.can_admin_results?
      return render status: :forbidden, json: { error: "Cannot adminster results" }
    end

    render json: { status: "ok" }
  end

  def scramble_program
    render json: {
      "current" => {
        "name" => "TNoodle-WCA-0.10.0",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-0.10.0.jar"
      },
      "allowed" => [
        "TNoodle-WCA-0.10.0"
      ],
      "history" => [
        "TNoodle-0.7.4",       # 2013-01-01
        "TNoodle-0.7.5",       # 2013-02-26
        "TNoodle-0.7.8",       # 2013-04-26
        "TNoodle-0.7.12",      # 2013-10-01
        "TNoodle-WCA-0.8.0",   # 2014-01-13
        "TNoodle-WCA-0.8.1",   # 2014-01-14
        "TNoodle-WCA-0.8.2",   # 2014-01-28
        "TNoodle-WCA-0.8.4",   # 2014-02-10
        "TNoodle-WCA-0.9.0",   # 2015-03-30
        "TNoodle-WCA-0.10.0"   # 2015-06-30
      ]
    }
  end

  def help
  end

  def search(*models)
    query = params[:q]
    unless query
      render status: :bad_request, json: { error: "No query specified" }
      return
    end
    result = models.map { |model| model.search(query, params: params).limit(DEFAULT_API_RESULT_LIMIT) }.flatten(1)
    render json: { status: "ok", result: result.map(&:to_jsonable) }
  end

  def posts_search
    search(Post)
  end

  def competitions_search
    search(Competition)
  end

  def users_search
    search(User)
  end

  def omni_search
    # We intentionally exclude Post, as our autocomplete ui isn't very useful with
    # them yet.
    params[:persons_table] = true
    search(Competition, User)
  end

  def show_user(user)
    if user
      render status: :ok, json: { status: "ok", user: user.to_jsonable }
    else
      render status: :not_found, json: { status: "ok", user: nil }
    end
  end

  def show_user_by_id
    user = User.find_by_id(params[:id])
    show_user(user)
  end

  def show_user_by_wca_id
    user = User.find_by_wca_id(params[:wca_id])
    show_user(user)
  end
end
