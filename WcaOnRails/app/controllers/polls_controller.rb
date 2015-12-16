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
    @open_polls = @polls.reject &:poll_is_over?
    @closed_polls = @polls.select &:poll_is_over?
  end

  def new
    @poll = Poll.new
  end

  def results
    @poll = Poll.find(params[:id])
  end

  def create
    @poll = Poll.new(poll_params)
    @poll.multiple = false
    @poll.deadline = Date.today + 15
    @poll.confirmed = false
    @poll.comment = ""
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

  def preview
    @poll = Poll.find(params[:id])
  end

  def update
    #debugger
    @poll = Poll.find(params[:id])
    if @poll.update_attributes(poll_params)
      if params[:commit] == "Confirm"
        flash[:success] = "Poll confirmed and open to voting"
      else
        flash[:success] = "Updated poll"
      end
      redirect_to edit_poll_path(@poll)
    else
      render :edit
    end
  end

  def destroy
    @poll = Poll.find(params[:id])

    if !@poll.confirmed && @poll.destroy
      flash[:success] = "Deleted poll"
      redirect_to polls_path
    else
      flash[:warning] = "Error deleting poll"
      render :edit
    end
  end

  def poll_params
    poll_params = params.require(:poll).permit(:question, :comment, :multiple, :deadline, :confirmed, poll_options_attributes: [:id, :description, :_destroy])
    if params[:commit] == "Confirm" && current_user.can_create_poll?
      poll_params[:confirmed] = true
    end
    debugger
    poll_params[:deadline] = params[:poll][:deadline].to_s + ":00"
    return poll_params
  end
end
