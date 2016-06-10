class CompetitionTabsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }

  private def competition_from_params
    Competition.find(params[:competition_id])
  end

  def index
    @competition = competition_from_params
  end

  def new
    @competition = competition_from_params
    @competition_tab = @competition.competition_tabs.build
  end
end
