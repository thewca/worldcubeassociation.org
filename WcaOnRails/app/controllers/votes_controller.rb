class VotesController < ApplicationController

  def create
    @vote = Vote.new(vote_params)
    if @vote.save
      flash[:success] = "Vote saved"
      redirect_to polls_path(@poll)
    else
      flash[:danger] = "Could not save your vote"
      render 'polls_vote'
    end
  end

  def update
    @vote = Vote.find(params[:id])
    if @vote.update_attributes(vote_params)
      flash[:success] = "Vote upated"
      redirect_to polls_path
    else
      flash[:danger] = "Could not update your vote"
      render 'polls_vote'
    end
  end

  def vote_params
    vote_params = params.require(:vote).permit(:poll_option_id, :comment)
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
