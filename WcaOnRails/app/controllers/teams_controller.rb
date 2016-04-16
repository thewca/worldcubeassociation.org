class TeamsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_teams?) }, except: [:edit, :update]
  before_action :assign_team, only: [:edit, :update]
  before_action -> { redirect_unless_user(:can_edit_team?, @team) }, only: [:edit, :update]

  def index
    @teams = Team.all
  end

  def new
    @team = Team.new
  end

  def create
    @team = Team.new(team_params)
    if @team.save
      flash[:success] = "Created new team"
      redirect_to edit_team_path(@team)
    else
      flash[:danger] = "Failed to create team"
      render :new
    end
  end

  def edit
  end

  def update
    if @team.update_attributes(team_params)
      flash[:success] = "Updated team"
      redirect_to edit_team_path(@team)
    else
      flash[:danger] = "Failed to update team"
      render :edit
    end
  end

  private def team_params
    team_params = params.require(:team).permit(:name, :description, :friendly_id, team_members_attributes: [:id, :team_id, :user_id, :start_date, :end_date, :team_leader, :_destroy])
    if team_params[:team_members_attributes]
      team_params[:team_members_attributes].each do |member|
        member.second.merge!(current_user: current_user.id)
      end
    end
    return team_params
  end

  private def assign_team
    @team = Team.find(params[:id])
  end
end
