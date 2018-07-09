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
      scrambles_to_import = []
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

            # Import scrambles
            round["groups"].each do |group|
              ["scrambles", "extraScrambles"].each do |scramble_type|
                group[scramble_type].each_with_index do |scramble, index|
                  new_scramble_attributes = {
                    competitionId: @competition.id,
                    eventId: event["eventId"],
                    roundTypeId: round["roundId"],
                    groupId: group["group"],
                    isExtra: scramble_type == "extraScrambles",
                    scrambleNum: index+1,
                    scramble: scramble,
                  }
                  scrambles_to_import << Scramble.new(new_scramble_attributes)
                end
              end
            end
          end
        end
      end
      begin
        ActiveRecord::Base.transaction do
          InboxPerson.where(competitionId: @competition.id).delete_all
          InboxResult.where(competitionId: @competition.id).delete_all
          Scramble.where(competitionId: @competition.id).delete_all
          InboxPerson.import!(persons_to_import)
          Scramble.import!(scrambles_to_import)
          InboxResult.import!(results_to_import)
        end
      rescue ActiveRecord::RecordInvalid => invalid
        object = invalid.record
        if object.class == Scramble
          @upload_json.errors.add(:results_file, "Scramble in round #{object.roundTypeId} of event #{object.eventId} is invalid (#{invalid.message}), please fix it!")
        elsif object.class == InboxPerson
          @upload_json.errors.add(:results_file, "Person #{object.name} is invalid (#{invalid.message}), please fix it!")
        elsif object.class == InboxResult
          @upload_json.errors.add(:results_file, "Result for person #{object.personId} in round #{object.roundTypeId} of event #{object.eventId} is invalid (#{invalid.message}), please fix it!")
        else
          # FIXME: that's actually not supposed to happen, as the only 3 types of records we create are above
          @upload_json.errors.add(:results_file, "An invalid record prevented the results from being created: #{invalid.message}")
        end
      end
      flash[:success] = "JSON File has been imported."
      redirect_to competition_submit_results_edit_path
    else
      # FIXME: maybe we should clear in any case? otherwise we would display errors/warning for inbox while trying to import another json
      @inbox_results = InboxResult.where(competitionId: @competition.id)
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
