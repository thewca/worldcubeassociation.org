class VotesController < ApplicationController
  before_action :authenticate_user!
  before_action :can_vote_in_poll_only

  def create
    #debugger
    @vote = Vote.new(vote_params)
    @poll = Poll.find(params[:vote][:poll_id])
    if @poll.multiple
      selected_poll_options = params[:vote][:poll_option_id].map { |option_id| PollOption.find_by_id option_id }.compact
      if selected_poll_options.length > 0
        all_saved = true
        selected_poll_options.each do |option|
          debugger
          vote = Vote.new(vote_params.merge(poll_option_id: option.id))
          if !vote.save
            all_saved = false
            break
          end
        end
        if all_saved
          flash[:success] = "Votes saved"
          redirect_to polls_path
        else
          flash[:danger] = "Could not save your votes"
          render "polls/vote"
        end
      else
        flash[:danger] = "You need to choose at least one option"
        render "polls/vote"
      end
    else
      if @vote.save
        flash[:success] = "Vote saved"
        redirect_to polls_path
      else
        flash[:danger] = "Could not save your vote"
        render "polls/vote"
      end
    end
  end

  def update
    @vote = Vote.find(params[:id])
    if @vote.update_attributes(vote_params)
      flash[:success] = "Vote upated"
      redirect_to polls_path
    else
      flash[:danger] = "Could not update your vote"
      render "polls/vote"
    end
  end

  def vote_params
    vote_params = params.require(:vote).permit(:poll_option_id, :comment)
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
