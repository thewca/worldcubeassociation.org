class PollsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :rss, :show]
  #before_action :can_create_poll_only, except: [:index, :rss, :show]

  def index
    @polls = Poll.all
  end

  def new
    @poll = Poll.new
  end

  def vote
    @poll = Poll.find(params[:id])
    @options = @poll.options.select(:id)
    vote = Vote.where("user_id = ? and option_id in (?)", current_user, @options)
    begin
      @vote = Vote.find(vote.select(:id))
    rescue
      @vote = Vote.new
    end
  end

  def create
    @poll = Poll.new(poll_params)
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
      flash[:success] = "Updated poll"
      redirect_to edit_poll_path(@poll)
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
    params.require(:poll).permit(:question, :multiple, :deadline)
  end
end
