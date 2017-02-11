# frozen_string_literal: true
class Api::V0::ApiController < ApplicationController
  before_filter :doorkeeper_authorize!, only: [:me]
  rescue_from WcaExceptions::BadApiParameter, with: :bad_api_parameter
  def bad_api_parameter(e)
    render status: :unprocessable_entity, json: { errors: [e.to_s] }
  end

  DEFAULT_API_RESULT_LIMIT = 20

  def me
    current_resource_owner = User.find(doorkeeper_token.resource_owner_id)
    current_resource_owner.doorkeeper_token = doorkeeper_token
    render json: { me: current_resource_owner }
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
        "name" => "TNoodle-WCA-0.11.5",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-0.11.5.jar",
      },
      "allowed" => [
        "TNoodle-WCA-0.11.5",
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
        "TNoodle-WCA-0.10.0",  # 2015-06-30
        "TNoodle-WCA-0.11.1",  # 2016-04-04
        "TNoodle-WCA-0.11.3",   # 2016-10-17
        "TNoodle-WCA-0.11.5",   # 2016-12-12
      ],
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
    result = models.flat_map { |model| model.search(query, params: params).limit(DEFAULT_API_RESULT_LIMIT) }
    render status: :ok, json: { result: result }
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

  def regulations_search
    search(Regulation)
  end

  def omni_search
    # We intentionally exclude Post, as our autocomplete ui isn't very useful with
    # them yet.
    params[:persons_table] = true
    search(Competition, User, Regulation)
  end

  def show_user(user)
    if user
      render status: :ok, json: { user: user }
    else
      render status: :not_found, json: { user: nil }
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

  def competitions
    params[:sort] ||= "-start_date"
    competitions = Competition.search(params[:q], params: params)
    competitions = competitions.includes(:delegates).includes(:organizers)

    paginate json: competitions
  end
end
