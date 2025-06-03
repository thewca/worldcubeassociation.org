# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }

  def new
    @competition = competition_from_params
    @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
    @results_validator.validate(@competition.id)
  end

  def upload_json
    @competition = competition_from_params
    return redirect_to competition_submit_results_edit_path if @competition.results_submitted?

    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)

    # This makes sure the json structure is valid!
    if @upload_json.import_to_inbox
      flash[:success] = "JSON File has been imported."
      @competition.uploaded_jsons.create(json_str: @upload_json.results_json_str)
      redirect_to competition_submit_results_edit_path
    else
      @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
      @results_validator.validate(@competition.id)
      render :new
    end
  end

  def import_from_live
    @competition = competition_from_params
    return redirect_to competition_submit_results_edit_path if @competition.results_submitted?

    results_to_import = @competition.rounds.flat_map do |round|
      round.round_results.map do |result|
        InboxResult.new({
                          competition: @competition,
                          person_id: result.person_id,
                          pos: result.ranking,
                          event_id: round.event_id,
                          round_type_id: round.round_type_id,
                          round_id: round.id,
                          format_id: round.format_id,
                          best: result.best,
                          average: result.average,
                          value1: result.attempts[0].result,
                          value2: result.attempts[1]&.result || 0,
                          value3: result.attempts[2]&.result || 0,
                          value4: result.attempts[3]&.result || 0,
                          value5: result.attempts[4]&.result || 0,
                        })
      end
    end

    person_with_results = results_to_import.map(&:person_id).uniq

    persons_to_import = @competition.registrations
                                    .includes(:user)
                                    .select { it.wcif_status == "accepted" && person_with_results.include?(it.registrant_id.to_s) }
                                    .map do
      InboxPerson.new({
                        id: it.registrant_id,
                        wca_id: it.wca_id || '',
                        competition_id: @competition.id,
                        name: it.name,
                        country_iso2: it.country.iso2,
                        gender: it.gender,
                        dob: it.dob,
                      })
    end

    scrambles_to_import = InboxScrambleSet.where(competition_id: @competition.id).flat_map do |scramble_set|
      scramble_set.inbox_scrambles.map do |scramble|
        Scramble.new({
                       competition_id: @competition.id,
                       event_id: scramble_set.event_id,
                       round_type_id: scramble_set.round_type_id,
                       round_id: scramble_set.matched_round_id,
                       group_id: scramble_set.alphabetic_group_index,
                       is_extra: scramble.is_extra,
                       scramble_num: scramble.ordered_index + 1,
                       scramble: scramble.scramble_string,
                     })
      end
    end

    errors = []
    ActiveRecord::Base.transaction do
      InboxPerson.where(competition_id: @competition.id).delete_all
      InboxResult.where(competition_id: @competition.id).delete_all
      Scramble.where(competition_id: @competition.id).delete_all
      InboxPerson.import!(persons_to_import)
      InboxResult.import!(results_to_import)
      Scramble.import!(scrambles_to_import)
    rescue ActiveRecord::RecordInvalid => e
      object = e.record
      errors << if object.instance_of?(InboxPerson)
                  "Person #{object.name} is invalid (#{e.message}), please fix it!"
                elsif object.instance_of?(InboxResult)
                  "Result for person #{object.person_id} in '#{Round.name_from_attributes_id(object.event_id, object.round_type_id)}' is invalid (#{e.message}), please fix it!"
                else
                  "An invalid record prevented the results from being created: #{e.message}"
                end
    end

    if errors.any?
      flash[:danger] = errors.join("<br/>")
      @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
      @results_validator.validate(@competition.id)
      return render :new
    end

    flash[:success] = "Data has been imported from WCA Live."
    redirect_to competition_submit_results_edit_path
  end

  def create
    # Check inbox, create submission, send email
    @competition = competition_from_params

    submit_results_params = params.require(:results_submission).permit(:message, :schedule_url, :confirm_information)
    submit_results_params[:competition_id] = @competition.id
    @results_submission = ResultsSubmission.new(submit_results_params)
    # This validates also that results in Inboxes are all good
    if @results_submission.valid?
      CompetitionsMailer.results_submitted(@competition, @results_submission, current_user).deliver_now

      flash[:success] = "Thank you for submitting the results!"
      @competition.update!(results_submitted_at: Time.now)
      redirect_to competition_path(@competition)
    else
      flash[:danger] = "Submitted results contain errors."
      @results_validator = @results_submission.results_validator
      render :new
    end
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
