class TeamMembersController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_committees?) }, only: [:new, :create]
  before_action -> { redirect_unless_user(:can_edit_team?, team_from_params) }, only: [:edit]
  before_action -> { redirect_unless_user(:can_edit_team?, team_from_params) }, only: [:update]

  def new
    @committee = committee_from_params
    @team = team_from_params
    @team_member = @team.team_members.new
  end

  def create
    @committee = committee_from_params
    @team = team_from_params
    @team_member = @team.team_members.new(team_member_params_create)
    if @team_member.save
      flash[:success] = "Added user as a team member of team:" + @team.name
      redirect_to committee_path(@committee)
    else
      render :new
    end
  end

  def edit
    @committee = committee_from_params
    @team = team_from_params
    @team_member = team_member_from_params
  end

  def update
    @committee = committee_from_params
    @team = team_from_params
    @team_member = team_member_from_params
    if @team_member.update_attributes(team_member_params_update)
      flash[:success] = "Updated team"
      redirect_to committee_path(@committee)
    else
      render :edit
    end
  end

  private def team_member_params_create
    params.require(:team_member).permit(:user_id, :start_date, :end_date, :committee_position_id)
  end

  private def team_member_params_update
    params.require(:team_member).permit(:start_date, :end_date)
  end

  private def committee_from_params
    Committee.find_by_slug(params[:committee_id])
  end

  private def team_from_params
    Team.find_by_slug(params[:team_id])
  end

  private def team_member_from_params
    TeamMember.find(params[:id])
  end
end
