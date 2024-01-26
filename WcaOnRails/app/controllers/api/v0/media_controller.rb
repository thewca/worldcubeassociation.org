class Api::V0::MediaController < Api::V0::ApiController
  def index
    params[:status] ||= "accepted"
    params[:year] ||= "All Years"
    params[:region] ||= "All Regions"

    media = CompetitionMedium.includes(:competition).where(status: params[:status]).order(timestampSubmitted: :desc)
    media = media.joins(:competition).where("YEAR(Competitions.start_date) = :media_start", media_start: params[:year]) unless params[:year] == "All Years"
    media = media.belongs_to_region(params[:region]) unless params[:region] == "All Regions"
    render json: media
  end
  
  def update
    medium_id = params.require(:id)
    status = params.require(:status)
    medium = CompetitionMedium.find(medium_id)
    medium.update!(status: status)
    render json: {
      success: true,
    }
  end
end
