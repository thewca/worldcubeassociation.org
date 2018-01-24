# frozen_string_literal: true

class Api::V0::ApiController < ApplicationController
  include Rails::Pagination
  protect_from_forgery with: :null_session
  before_action :doorkeeper_authorize!, only: [:me]
  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
  end

  DEFAULT_API_RESULT_LIMIT = 20

  def me
    render json: { me: current_api_user }, private_attributes: doorkeeper_token.scopes
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
        "name" => "TNoodle-WCA-0.13.0",
        "information" => "#{root_url}regulations/scrambles/",
        "download" => "#{root_url}regulations/scrambles/tnoodle/TNoodle-WCA-0.13.0.jar",
      },
      "allowed" => [
        "TNoodle-WCA-0.13.0",
      ],
      "history" => [
        "TNoodle-0.7.4",
        "TNoodle-0.7.5",
        "TNoodle-0.7.8",
        "TNoodle-0.7.12",
        "TNoodle-WCA-0.8.0",
        "TNoodle-WCA-0.8.1",
        "TNoodle-WCA-0.8.2",
        "TNoodle-WCA-0.8.4",
        "TNoodle-WCA-0.9.0",
        "TNoodle-WCA-0.10.0",
        "TNoodle-WCA-0.11.1",
        "TNoodle-WCA-0.11.3",
        "TNoodle-WCA-0.11.5",
        "TNoodle-WCA-0.12.0",
        "TNoodle-WCA-0.13.0",
      ],
    }
  end

  def help
  end

  def search(*models)
    query = params[:q]&.slice(0...SearchResultsController::SEARCH_QUERY_LIMIT)
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

  def delegates
    paginate json: User.delegates
  end

  # Find the user that owns the access token.
  # From: https://github.com/doorkeeper-gem/doorkeeper#authenticated-resource-owner
  private def current_api_user
    return @current_api_user if defined?(@current_api_user)

    @current_api_user = User.find_by_id(doorkeeper_token&.resource_owner_id)
  end
end
