# frozen_string_literal: true
class Api::V0::CompetitionsController < Api::V0::ApiController
  def show
    competition = Competition.where(id: params[:id], showAtAll: true).first
    unless competition
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
      return
    end
    render json: competition
  end

  def results
  	competition = Competition.where(id: params[:id], showAtAll: true).first
  	unless competition
  		render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
  		return
  	end
  	render json: Result.search_by_competition(competition.id, params: params)
  end
end
