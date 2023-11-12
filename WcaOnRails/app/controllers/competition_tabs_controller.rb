# frozen_string_literal: true

class CompetitionTabsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }

  def index
    @competition = competition_from_params
    @competition_tabs = @competition.tabs
  end

  def new
    @competition = competition_from_params
    @competition_tab = @competition.tabs.build
  end

  def create
    @competition = competition_from_params
    @competition_tab = @competition.tabs.build(competition_tab_params)
    if @competition_tab.save
      flash[:success] = "Successfully created #{@competition_tab.name} tab."
      redirect_to competition_tabs_path(@competition)
    else
      render :new
    end
  end

  def edit
    @competition = competition_from_params
    @competition_tab = CompetitionTab.find_by!(id: params[:id], competition: @competition)
  end

  def update
    @competition = competition_from_params
    @competition_tab = CompetitionTab.find_by!(id: params[:id], competition: @competition)
    if @competition_tab.update(competition_tab_params)
      flash[:success] = "Successfully updated #{@competition_tab.name} tab."
      redirect_to edit_competition_tab_path(@competition, @competition_tab)
    else
      render :edit
    end
  end

  def destroy
    @competition = competition_from_params
    CompetitionTab.find_by(id: params[:id], competition: @competition)&.destroy
    redirect_to competition_tabs_path(@competition)
  end

  def reorder
    competition = competition_from_params
    competition_tab = CompetitionTab.find_by!(id: params[:id], competition: competition)
    competition_tab.reorder(params[:direction])
    render nothing: true
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end

  private def competition_tab_params
    params.require(:competition_tab).permit(:name, :content)
  end
end
