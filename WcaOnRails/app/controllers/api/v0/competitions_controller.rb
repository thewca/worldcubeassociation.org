class Api::V0::CompetitionsController < ApplicationController
  def show
    competition = Competition.find_by_id(params[:id])
    unless competition
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
      return
    end
    render json: {
      status: "ok",
      id: competition.id,
      website: competition.website,
      start_date: competition.start_date,
      end_date: competition.end_date,
    }
  end
end
