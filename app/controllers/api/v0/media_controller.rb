class Api::V0::MediaController < Api::V0::ApiController
  def index
    params[:status] ||= "accepted"
    params[:year] ||= "all years"
    params[:region] ||= "all"

    media = CompetitionMedium.includes(:competition).where(status: params[:status]).order(timestampSubmitted: :desc)
    media = media.joins(:competition).where("YEAR(Competitions.start_date) = :media_start", media_start: params[:year]) unless params[:year] == "all years"
    media = media.belongs_to_region(params[:region]) unless params[:region] == "all"
    render json: media
  end
  
  def update
    @medium = CompetitionMedium.find(params[:id])
    if @medium.update(medium_params)
      render json: {
          success: true,
        }
    else
      render json: {
          success: false,
        }
    end
  end

  def destroy
    @medium = CompetitionMedium.find(params[:id])
    if @medium.destroy
      render json: {
          success: true,
        }
    else
      render json: {
          success: false,
        }
    end
  end

end
