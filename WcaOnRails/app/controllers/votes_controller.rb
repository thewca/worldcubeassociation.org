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
    @poll = @vote.poll
    if @vote.update_attributes(vote_params)
      flash[:success] = "Vote updated"
      redirect_to polls_path
    else
      flash[:danger] = "Could not upate your vote"
      render "polls/vote"
    end
  end

  def vote_params
    #debugger
    vote_params = params.require(:vote).permit(:poll_id, :comment, poll_option_ids: [])
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
