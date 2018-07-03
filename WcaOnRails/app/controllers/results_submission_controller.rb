# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_submit_competition_results?, competition_from_params) }

  def new
    @competition = competition_from_params
    @results_submission = ResultsSubmission.new
  end

  def create
    @competition = competition_from_params

    submit_results_params = params.require(:results_submission).permit(:results_file, :message, :schedule_url)
    submit_results_params[:competition_id] = @competition.id
    @results_submission = ResultsSubmission.new(submit_results_params)
    if @results_submission.valid?
      CompetitionsMailer.results_submitted(@competition, @results_submission, current_user).deliver_now

      flash[:success] = "Thank you for submitting the results!"
      redirect_to competition_path(@competition)
    else
      render :new
    end
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
