# frozen_string_literal: true
class Api::V0::CompetitionsController < Api::V0::ApiController
  def index
    competitions = Competition.search(params[:q], params: params)
    competitions = competitions.includes(:delegates, :organizers)

    paginate json: competitions
  end

  def show
    competition = Competition.where(id: params[:id], showAtAll: true).first
    unless competition
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
      return
    end
    render json: competition
  end
end
