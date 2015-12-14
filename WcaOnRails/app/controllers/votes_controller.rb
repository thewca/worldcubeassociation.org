class VotesController < ApplicationController
  before_action :authenticate_user!
  before_action :can_vote_in_poll_only

  def create
    @vote = Vote.new(vote_params)
    if @vote.save
      flash[:success] = "Vote saved"
      redirect_to polls_path
    else
      render 'polls/vote'
    end
  end

  def update
    @vote = Vote.find(params[:id])
    @poll = Poll.find(params[:vote][:poll_id])
    option = PollOption.find(params[:vote][:poll_option_id])
    if option.poll_id == @poll.id && @vote.update_attributes(vote_params)
      flash[:success] = "Vote upated"
      redirect_to polls_path
    else
      flash[:danger] = "Could not update your vote"
      render "polls/vote"
    end
  end

  def vote_params
    debugger
    vote_params = params.require(:vote).permit(:poll_id, :comment, poll_options_attributes: [:id])
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
