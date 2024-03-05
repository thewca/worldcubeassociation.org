# frozen_string_literal: true

class VotesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_vote_in_poll?) }

  def vote
    @poll = Poll.find(params[:id])
    @vote = @poll.votes.find_by_user_id(current_user.id) || Vote.new
  end

  def create
    @vote = current_user.votes.build(vote_params)
    if @vote.save
      flash[:success] = "Vote saved"
      redirect_to polls_vote_path(@vote.poll.id)
    else
      render :vote
    end
  end

  def update
    @vote = Vote.find(params[:id])
    @poll = @vote.poll
    if @vote.update(vote_params)
      flash[:success] = "Vote updated"
      redirect_to polls_vote_path(@vote.poll.id)
    else
      flash.now[:danger] = "Could not upate your vote"
      render :vote
    end
  end

  def vote_params
    params.require(:vote).permit(:poll_id, :comment, poll_option_ids: [])
  end
end
