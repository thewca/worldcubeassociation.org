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

    if results
    	render status: :ok, json: results
    else
      render status: 404, json: { error: "WCA ID does not exist" }
    end
  end

  def rankings
  	person = Person.find_by_wca_id(params[:wca_id])
  	ranksSingle = person.ranksSingle.index_by(&:eventId)
  	ranksAverage = person.ranksAverage.index_by(&:eventId)

  	if person
  		render status: :ok, json: { single: ranksSingle, average: ranksAverage }
  	else
  		render status: 404, json: { error: "WCA ID does not exist" }
  	end
  end
end
