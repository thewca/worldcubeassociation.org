class CommitteesController < ApplicationController
  before_action :authenticate_user!, except: [ :index, :show ]
  before_action -> { redirect_unless_user(:can_manage_committees?) }, except: [ :index, :show ]

  def index
    @committees = Committee.all
  end

  def show
    @committee = committee_from_params
  end

  def new
    @committee = Committee.new
  end

  def edit
    @committee = committee_from_params
  end

  def create
    @committee = Committee.new(committee_params)

    if @committee.save
      flash[:success] = "Successfully created new committee!"
      redirect_to committee_path(@committee)
    else
      render :new
    end
  end

  def update
    @committee = committee_from_params

    if @committee.update(committee_params)
      flash[:success] = "Successfully update committee!"
      redirect_to committee_path(@committee)
    else
      render 'edit'
    end
  end

  def destroy
    @committee = committee_from_params
    if @committee.teams.empty?
      @committee.destroy
      flash[:success] = "Successfully deleted committee!"
      redirect_to committees_path
    else
      flash[:error] = "Cannot delete a committee whilst it still has teams. If you really want to delete this committee then delete the teams first."
      redirect_to committee_path(@committee)
    end
  end

  def to_params
    slug
  end

  def committee_from_params
    Committee.find_by_slug(params[:id])
  end

  def committee_params
    params.require(:committee).permit(:name, :email, :duties)
  end
end
