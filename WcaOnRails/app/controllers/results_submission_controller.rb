# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_submit_competition_results?, competition_from_params) }

  def new
    @competition = competition_from_params
    # Should always have an upload_json
    @upload_json = UploadJson.new
    # TODO: do the result detection and actual result submission
    @results_submission = ResultsSubmission.new
  end

  def upload_json
    @competition = competition_from_params
    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)
    @results_submission = ResultsSubmission.new

    # This makes sure the json structure is valid!
    if @upload_json.valid?
      # FIXME: to attribute
      json = JSON.parse(@upload_json.results_json_str)
      persons_to_import = []
      json["persons"].each do |p|
        new_person_attributes = p.merge(competitionId: @competition.id)
        # TODO: index on (competition_id, personId) to raise stuff
        persons_to_import << InboxPerson.new(new_person_attributes)
      end
      results_to_import = []
      json["events"].each do |event|
        event["rounds"].each do |round|
          round["results"].each do |result|
            individual_results = result["results"]
            # Pad the results with 0 up to 5 results
            individual_results.fill(0, individual_results.length...5)
            new_result_attributes = {
              personId: result["personId"],
              pos: result["position"],
              eventId: event["eventId"],
              roundTypeId: round["roundId"],
              formatId: round["formatId"],
              best: result["best"],
              average: result["average"],
              value1: individual_results[0],
              value2: individual_results[1],
              value3: individual_results[2],
              value4: individual_results[3],
              value5: individual_results[4],
            }
            new_res = InboxResult.new(new_result_attributes)
            # Using this way of setting the attribute saves one SELECT per result
            # to validate the competition presence.
            # (a lot of time considering all the results to import!)
            new_res.competition = @competition
            results_to_import << new_res
          end
        end
      end
      # TODO scrambles
      ActiveRecord::Base.transaction do
        InboxPerson.where(competitionId: @competition.id).delete_all
        InboxResult.where(competitionId: @competition.id).delete_all
        begin
          InboxPerson.import!(persons_to_import)
        rescue ActiveRecord::RecordInvalid => invalid
          @upload_json.errors.add(:results_file, "Person #{invalid.record.name} is invalid (#{invalid.message}), please fix it!")
        end
        begin
          InboxResult.import!(results_to_import)
        rescue ActiveRecord::RecordInvalid => invalid
          result = invalid.record
          @upload_json.errors.add(:results_file, "Result for person #{result.personId} in round #{result.roundTypeId} of event #{result.eventId} is invalid (#{invalid.message}), please fix it!")
        end
      end
      # TODO
      render :new
    else
      render :new
    end
  end

  def create
    # Check inbox, create submission, send email
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
