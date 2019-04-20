# frozen_string_literal: true

class PollsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_create_poll?) }, only: [:new, :create, :update, :destroy]
  before_action -> { redirect_to_root_unless_user(:can_view_poll?) }, only: [:index, :results]

  def index
    @polls = current_user.can_create_poll? ? Poll.all : Poll.confirmed
    @closed_polls, @open_polls = @polls.partition(&:over?)
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

  def update
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

    if !@poll.confirmed? && @poll.destroy
      flash[:success] = "Deleted poll"
      redirect_to polls_path
    else
      flash[:warning] = "Error deleting poll"
      render :edit
    end
  end

  def poll_params
    params.require(:poll).permit(
      :question,
      :comment,
      :multiple,
      :deadline,
      :confirmed_at,
      poll_options_attributes: [:id, :description, :_destroy],
    ).tap do |poll_params|
      if params[:commit] == "Confirm" && current_user.can_create_poll?
        poll_params[:confirmed_at] = Time.now
      end
    end
  end
end
