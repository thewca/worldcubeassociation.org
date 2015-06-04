class CompetitionsController < ApplicationController
  before_action :authenticate_user!
  before_action :can_admin_results_only

  def index
    @competitions_grid = initialize_grid(Competition, {
      order: 'year',
      order_direction: 'desc',
      custom_order: {
        # Dirty hack to sort properly with our bizarre date schema.
        # The right thing to do here is to migrate these into a single DATE field.
        'Competitions.year' => lambda do |f|
          order_direction = @competitions_grid.status[:order_direction]
          order_str = "year #{order_direction}, month #{order_direction}, day"
          # Make uninitialized years show up on top when sorting by most recent first.
          if order_direction.to_sym == :desc
            order_str = "year<>0, #{order_str}"
          end
          order_str
        end
      }
    })
  end

  def edit
    @competition = Competition.find(params[:id])
  end

  def update
    @competition = Competition.find(params[:id])
    if @competition.update_attributes(competition_params)
      flash[:success] = "Successfully saved competition"
      redirect_to edit_competition_path(@competition)
    else
      render 'edit'
    end
  end

  private def competition_params
    params.require(:competition).permit(
      :isConfirmed,
      :showAtAll,
      :name,
      :cellName,
      :countryId,
      :cityName,
      :venue,
      :venueAddress,
      :latitude,
      :longitude,
      :venueDetails,
      :year,
      :month,
      :day,
      :endMonth,
      :endDay,
      :information,
      :wcaDelegate,
      :organiser,
      :website,
      :eventSpecs,
      :showPreregForm,
      :showPreregList,
    )
  end
end
