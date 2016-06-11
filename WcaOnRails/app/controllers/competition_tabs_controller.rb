class CompetitionTabsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }

  def index
    @competition = competition_from_params
  end

  def new
    @competition = competition_from_params
    @competition_tab = @competition.competition_tabs.build
  end

  def create
    @competition = competition_from_params
    if @competition.competition_tabs.create(competition_tab_params)
      redirect_to competition_tabs_path(@competition)
    else
      render :new
    end
  end

  def edit
    @competition = competition_from_params
    @competition_tab = CompetitionTab.find(params[:id])
  end

  def update
    @competition = competition_from_params
    @competition_tab = CompetitionTab.find(params[:id])
    if @competition_tab.update_attributes(competition_tab_params)
      redirect_to edit_competition_tab_path(@competition, @competition_tab)
    else
      render :edit
    end
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end

  private def competition_tab_params
    params.require(:competition_tab).permit(:name, :content)
  end
end
