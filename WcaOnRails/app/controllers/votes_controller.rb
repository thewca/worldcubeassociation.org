class VotesController < ApplicationController

  def create
    @vote = Vote.new(vote_params)
    if @vote.save
      flash[:success] = "Vote saved"
      redirect_to polls_results_path(@vote.poll_option.poll)
    else
      flash[:danger] = "Could not save your vote"
      render 'polls_vote'
    end
  end

  def vote_params
    vote_params = params.require(:vote).permit(:option_id, :comment)
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
