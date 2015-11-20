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
    render json: { me: current_resource_owner.to_jsonable(include_private_info: true) }
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

  def posts_search
    query = params[:q]
    unless query
      render status: :bad_request, json: { error: "No query specified" }
      return
    end
    sql_query = "%#{query}%"

    posts = Post.where("world_readable = 1 AND (title LIKE :sql_query OR body LIKE :sql_query)", sql_query: sql_query).order(created_at: :desc)

    posts = posts.limit(DEFAULT_API_RESULT_LIMIT)
    render json: { status: "ok", posts: posts.map(&:to_jsonable) }
  end

  def competitions_search
    query = params[:q]
    unless query
      render status: :bad_request, json: { error: "No query specified" }
      return
    end
    sql_query = "%#{query}%"

    competitions = Competition.where("id LIKE :sql_query OR name LIKE :sql_query OR cellName LIKE :sql_query OR cityName LIKE :sql_query OR countryId LIKE :sql_query", sql_query: sql_query).order(year: :desc, month: :desc, day: :desc)

    competitions = competitions.limit(DEFAULT_API_RESULT_LIMIT)
    render json: { status: "ok", competitions: competitions.map(&:to_jsonable) }
  end

  def users_search
    query = params[:q]
    unless query
      render status: :bad_request, json: { error: "No query specified" }
      return
    end
    sql_query = "%#{query}%"

    if !ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:persons_table])
      users = User

      if !ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:include_dummy_accounts])
        # Ignore dummy accounts
        users = users.where.not(encrypted_password: '')
        # Ignore unconfirmed accounts
        users = users.where.not(confirmed_at: nil)
      end

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_delegates])
        users = users.where.not(delegate_status: nil)
      end

      if ActiveRecord::Type::Boolean.new.type_cast_from_database(params[:only_with_wca_ids])
        users = users.where.not(wca_id: nil)
      end
      users = users.where("name LIKE :sql_query OR wca_id LIKE :sql_query", sql_query: sql_query)
    else
      users = Person.where("name LIKE :sql_query OR id LIKE :sql_query", sql_query: sql_query)
    end

    users = users.limit(DEFAULT_API_RESULT_LIMIT)
    render json: { status: "ok", users: users.map(&:to_jsonable) }
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

  private def current_resource_owner
    User.find(doorkeeper_token.resource_owner_id) if doorkeeper_token
  end
end
