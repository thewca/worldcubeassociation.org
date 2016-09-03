# frozen_string_literal: true
class CommitteePositionsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_manage_committees?) }

  def index
    @committee = committee_from_params
    @positions = @committee.committee_positions
  end

  def new
    @committee = committee_from_params
    @position = @committee.committee_positions.new
  end

  def edit
    @position = committee_position_from_params
    @committee = @position.committee
  end

  def create
    @committee = committee_from_params
    @position = @committee.committee_positions.new(committee_position_params)
    if @position.save
      flash[:success] = "Created new committee position:" + @position.name
      redirect_to committee_positions_path(@committee)
    else
      render :new
    end
  end

  def update
    @position = committee_position_from_params
    @committee = @position.committee
    if @position.update_attributes(committee_position_params)
      flash[:success] = "Updated committee position"
      redirect_to committee_positions_path(@committee)
    else
      render :edit
    end
  end

  def destroy
    @position = committee_position_from_params
    @committee = @position.committee
    if @position.team_members.empty?
      if @position.destroy
        flash[:success] = "Successfully deleted committee position!"
      else
        flash[:error] = "Error: Could not delete committee position" + @position.name
      end
    else
      flash[:error] = "Cannot delete a committee position whilst it still has team members. If you really want to delete this committee position then delete the team members first."
    end
    redirect_to committee_positions_path(@committee)
  end

  private def committee_position_params
    params.require(:committee_position).permit(:name, :description, :team_leader)
  end

  private def committee_from_params
    Committee.find_by_slug(params[:committee_id])
  end

  private def committee_position_from_params
    CommitteePosition.find(params[:id])
  end
end
