# frozen_string_literal: true
class TeamsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_committees?) }, only: [:new, :create, :destroy]
  before_action -> { redirect_unless_user(:can_edit_team?, team_from_params) }, only: [:edit]
  before_action -> { redirect_unless_user(:can_edit_team?, team_from_params) }, only: [:update]

  def new
    @committee = committee_from_params
    @team = @committee.teams.new
  end

  def create
    @committee = committee_from_params
    @team = @committee.teams.new(team_params)
    if @team.save
      flash[:success] = "Created new team:" + @team.name
      redirect_to committee_path(@committee)
    else
      render :new
    end
  end

  def edit
    @committee = committee_from_params
    @team = team_from_params
  end

  def update
    @committee = committee_from_params
    @team = team_from_params
    if @team.update_attributes(team_params)
      flash[:success] = "Updated team"
      redirect_to committee_path(@committee)
    else
      render :edit
    end
  end

  def destroy
    @committee = committee_from_params
    @team = team_from_params
    if @team.team_members.empty?
      if @team.destroy
        flash[:success] = "Successfully deleted team!"
      else
        flash[:error] = "Error: Could not delete team" + @team.name
      end
    else
      flash[:error] = "Cannot delete a team whilst it still has team members. If you really want to delete this team then delete the team members first."
    end
    redirect_to committee_path(@committee)
  end

  private def team_params
    params.require(:team).permit(:name, :description)
  end

  private def committee_from_params
    Committee.find_by_slug(params[:committee_id])
  end

  private def team_from_params
    Team.find_by_slug(params[:id])
  end
end
