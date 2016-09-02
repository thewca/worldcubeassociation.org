# frozen_string_literal: true
class Api::V0::UsersController < Api::V0::ApiController
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

  def results
    results = Result.search_by_person(params[:wca_id], params: params)
    if !results
      render status: 404, json: {error: "WCA ID doesn't exist", results: results}
    else
    render status: :ok, json: results
    end
  end
end
