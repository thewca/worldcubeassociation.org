# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_submit_competition_results?, competition_from_params) }

  def edit
    @competition = competition_from_params
  end

  def submit
    @competition = competition_from_params

    if params[:results].blank? || params[:message].blank?
      flash.now[:danger] = "Please make sure to fill in the message and attach the results file."
      render :edit
    else
      CompetitionsMailer.results_submitted(@competition, params[:message], current_user.name, params[:results].read).deliver_now

      flash[:success] = "Thank you for submitting the results!"
      redirect_to competition_path(@competition)
    end
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
