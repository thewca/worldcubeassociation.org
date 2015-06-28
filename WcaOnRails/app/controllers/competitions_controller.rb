class CompetitionsController < ApplicationController
  before_action :authenticate_user!
  before_action :can_admin_results_only, except: [:edit]
  # TODO - change so organizers/delegates can access their own comps as well
  before_action :can_admin_results_only, only: [:edit]

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

  def admin_edit
    @competition = Competition.find(params[:id])
    @admin_view = true
    render 'edit'
  end

  def edit
    @competition = Competition.find(params[:id])
  end

  def update
    @competition = Competition.find(params[:id])
    if @competition.update_attributes(competition_params)
      flash[:success] = "Successfully saved competition"
      if params.has_key?(:admin_view)
        redirect_to admin_edit_competition_path(@competition)
      else
        redirect_to edit_competition_path(@competition)
      end
    else
      render 'edit'
    end
  end

  private def competition_params
    permitted_competition_params = []
    if @competition.isConfirmed? && !current_user.can_admin_results?
      # If the competition is confirmed, non admins are not allowed to change anything.
    else
      permitted_competition_params += [
        :name,
        :cellName,
        :countryId,
        :cityName,
        :venue,
        :venueAddress,
        :latitude_degrees,
        :longitude_degrees,
        :venueDetails,
        :start_date,
        :end_date,
        :information,
        :wcaDelegate,
        :organiser,
        :website,
        :showPreregForm,
        :showPreregList,
        event_ids: Event.all.map { |event| event.id.to_sym },
      ]
      if current_user.can_admin_results?
        permitted_competition_params += [
          :isConfirmed,
          :showAtAll
        ]
      end
    end

    competition_params = params.require(:competition).permit(*permitted_competition_params)
    if competition_params.has_key?(:event_ids)
      competition_params[:eventSpecs] = competition_params[:event_ids].select { |k, v| v == "1" }.keys.join " "
      competition_params.delete(:event_ids)
    end
    unless competition_params[:showPreregForm] == "1"
      competition_params[:showPreregList] = "0"
    end
    if params[:commit] == "Confirm"
      competition_params[:isConfirmed] = true
    end
    competition_params
  end
end
