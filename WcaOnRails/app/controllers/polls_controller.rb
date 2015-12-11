class PollsController < ApplicationController
  before_action :authenticate_user!
  before_action :can_create_poll_only, only: [:new, :create, :update, :destroy]
  before_action :can_vote_in_poll_only, only: [:index, :vote, :results]

  def index
    if current_user.can_create_poll?
      @polls = Poll.all
    else
      @polls = Poll.where(confirmed: true)
    end
  end

  def new
    @poll = Poll.new
  end

  def vote
    @poll = Poll.find(params[:id])
    @already_voted = @poll.user_already_voted?(current_user)
    @vote = @poll.votes.find_by user_id: current_user
    if @vote == nil
      @vote = Vote.new
    end
  end

  def results
    @poll = Poll.find(params[:id])
  end

  def create
    @poll = Poll.new(poll_params)
    @poll.multiple = false
    @poll.deadline = Date.today + 15
    @poll.confirmed = false
    if @poll.save
      flash[:success] = "Created new poll"
      redirect_to edit_poll_path(@poll)
    else
      render :new
    end
  end

  def edit
    @poll = Poll.find(params[:id])
  end

  def update
    @poll = Poll.find(params[:id])
    if @poll.update_attributes(poll_params)
      if params[:commit] == "Confirm"
        flash[:success] = "Poll confirmed and open to voting"
      else
        flash[:success] = "Updated poll"
      end
      redirect_to polls_path
    else
      render 'edit'
    end
  end

  def destroy
    @poll = Poll.find(params[:id])
    if @poll.destroy
      flash[:success] = "Deleted poll"
      redirect_to root_url
    else
      flash[:warning] = "Error deleting poll"
    end
  end

  def poll_params
    poll_params = params.require(:poll).permit(:question, :multiple, :deadline, :confirmed, poll_options_attributes: [:id, :description, :_destroy])
    if params[:commit] == "Confirm" && current_user.can_create_poll?
      poll_params[:confirmed] = true
    end
    return poll_params
  end
end
