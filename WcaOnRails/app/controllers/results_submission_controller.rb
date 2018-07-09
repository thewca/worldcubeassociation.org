# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_submit_competition_results?, competition_from_params) }

  def new
    @competition = competition_from_params
    # Should always have an upload_json
    @upload_json = UploadJson.new
    @inbox_results = InboxResult.sorted_for_competition(@competition.id)
    @inbox_persons = InboxPerson.where(competitionId: @competition.id)
    @scrambles = Scramble.where(competitionId: @competition.id)
    @all_errors = []
    @all_warnings = []
    if @inbox_results.any?
      @all_errors, @all_warnings = CompetitionResultsValidator.validate(@inbox_persons, @inbox_results, @scrambles, @competition.id)
    end
    @total_errors = @all_errors.map { |key, value| value }.map(&:size).reduce(:+) || 0
    @total_warnings = @all_warnings.map { |key, value| value }.map(&:size).reduce(:+) || 0
    @results_submission = ResultsSubmission.new
  end

  def upload_json
    @competition = competition_from_params
    if @competition.results_submitted?
      return redirect_to competition_submit_results_edit_path
    end
    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)
    @results_submission = ResultsSubmission.new

    # This makes sure the json structure is valid!
    if @upload_json.import_to_inbox
        flash[:success] = "JSON File has been imported."
        redirect_to competition_submit_results_edit_path
    else
      # FIXME: maybe we should clear in any case? otherwise we would display errors/warning for inbox while trying to import another json
      #@inbox_results = InboxResult.where(competitionId: @competition.id)
      @inbox_results = []
      # FIXME: clarify this as it could show green for invalid results on invalid json
      @all_errors = []
      @all_warnings = []
      @total_errors = 0
      @total_warnings = 0
      render :new
    end
  end

  def create
    # Check inbox, create submission, send email
    @competition = competition_from_params

    submit_results_params = params.require(:results_submission).permit(:message, :schedule_url)
    submit_results_params[:competition_id] = @competition.id
    @results_submission = ResultsSubmission.new(submit_results_params)
    if @results_submission.valid?
      CompetitionsMailer.results_submitted(@competition, @results_submission, current_user).deliver_now

      flash[:success] = "Thank you for submitting the results!"
      @competition.update!(results_submitted_at: Time.now)
      redirect_to competition_path(@competition)
    else
      # FIXME: maybe we should extract this to a separate method
      @upload_json = UploadJson.new
      @inbox_results = InboxResult.sorted_for_competition(@competition.id)
      @inbox_persons = InboxPerson.where(competitionId: @competition.id)
      @scrambles = Scramble.where(competitionId: @competition.id)
      @all_errors = []
      @all_warnings = []
      if @inbox_results.any?
        @all_errors, @all_warnings = CompetitionResultsValidator.validate(@inbox_persons, @inbox_results, @scrambles, @competition.id)
      end
      @total_errors = @all_errors.map { |key, value| value }.map(&:size).reduce(:+) || 0
      @total_warnings = @all_warnings.map { |key, value| value }.map(&:size).reduce(:+) || 0
      render :new
    end
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
