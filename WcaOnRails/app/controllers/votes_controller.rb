class VotesController < ApplicationController
  before_action :authenticate_user!
  before_action :can_vote_in_poll_only

  def create
    @vote = Vote.new(vote_params)
    @poll = Poll.find(params[:vote][:poll_id])
    if @poll.multiple
      #first destroy existing votes by this user in this poll - updating is not working because we don't have a single vote object
      #find all votes from this user in this poll
      votes = @poll.votes.where(user_id: current_user)
      #start a variable to track the votes deleting
      deleted_votes = true
      #for each vote
      votes.each do |vt|
        #try to delete
        if !vt.destroy
          #if it fails, change the boolean and stop
          deleted_votes = false
          break
        end
      end
      #if all votes were deleted, we can try to save the new ones
      if deleted_votes
        selected_poll_options = params[:vote][:poll_option_id].map { |option_id| PollOption.find_by_id option_id }.compact
        if selected_poll_options.length > 0
          all_saved = true
          selected_poll_options.each do |option|
            vote = Vote.new(vote_params.merge(poll_option_id: option.id))
            #we also need to check if this option belongs to the current poll
            if option.poll_id == @poll.id && !vote.save
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
      else #if deleting the votes failed
        flash[:danger] = "An error occurred"
        render "polls/vote"
      end
    else
      #check if this option belongs to the current poll
      option = PollOption.find(params[:vote][:poll_option_id])
      if option.poll_id == @poll.id && @vote.save
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
    vote_params = params.require(:vote).permit(:poll_option_id, :comment)
    vote_params[:user_id] = current_user.id
    return vote_params
  end
end
