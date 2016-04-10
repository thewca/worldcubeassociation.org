class Api::V0::CompetitionsController < Api::V0::ApiController
  def show
    competition = Competition.where(id: params[:id], showAtAll: true).first
    unless competition
      render json: { error: "Competition with id #{params[:id]} not found" }, status: 404
      return
    end
    render json: competition
  end
end
