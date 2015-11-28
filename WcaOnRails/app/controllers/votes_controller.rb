class VotesController < ApplicationController

  def create
    if current_user && params[:vote_option][:id]
      #@poll = Poll.find(params[:id])
      #@option = @poll.options.find_by_id(params[:vote_option][:id])
      #if @option && @poll
        #@option.votes.create({user_id: current_user.id})
      #else
        #render js: 'alert(\'Your vote cannot be saved. Missing information\');'
      #end
      vote_params = {user_id: current_user.id, option_id: params[:vote_option][:id], comment: params[:comment][:body]}
      @vote = Vote.new(vote_params)
      if @vote.save
        flash[:success] = "Vote saved"
        redirect_to competitions_path
      end
      #render js: 'alert(\'Great! User: ' + current_user.id.to_s + ' voted on option ' + params[:vote_option][:id].to_s + '\');'
    else
      render js: 'alert(\'Your vote cannot be saved.\nTry again\');'
    end
  end
end
