# frozen_string_literal: true
class Api::V0::CompetitionsController < Api::V0::ApiController
  def show
    competition = Competition.visible.find_by(id: params[:id])
    if competition
      render json: competition, status: ok
    else
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
    end
  end

  def results
    competition = Competition.visible.find_by(id: params[:id])
    if competition
      results = Result.search_by_competition(competition.id, params: params)
      render json: results, status: ok
    else
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
    end
  end
end
