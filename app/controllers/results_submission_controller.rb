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

  def upload_scramble_json
    competition = competition_from_params

    uploaded_file = params.require(:tnoodle).require(:json)

    raw_file_contents = uploaded_file.read
    tnoodle_json = JSON.parse(raw_file_contents, symbolize_names: true)

    # The original Java `LocalDateTime` format is defined as `"MMM dd, yyyy h:m:s a"`.
    generation_date = DateTime.strptime(tnoodle_json[:generationDate], "%b %d, %Y %l:%M:%S %p")
    tnoodle_version = tnoodle_json[:version]

    existing_upload = ScrambleFileUpload
                      .includes(inbox_scramble_sets: { inbox_scrambles: [], matched_round: [:competition_event] })
                      .find_by(
                        competition: competition,
                        scramble_program: tnoodle_version,
                        generated_at: generation_date,
                      )

    return render json: { success: :ok, scramble_file: existing_upload } if existing_upload.present?

    tnoodle_wcif = tnoodle_json[:wcif]

    scr_file_upload = ScrambleFileUpload.create!(
      uploaded_by_user: current_user,
      uploaded_at: DateTime.now,
      competition: competition,
      original_filename: uploaded_file.original_filename,
      scramble_program: tnoodle_version,
      generated_at: generation_date,
      raw_wcif: tnoodle_wcif,
    )

    scr_file_upload.transaction do
      tnoodle_wcif[:events].each do |wcif_event|
        competition_event = competition.competition_events.find_by(event_id: wcif_event[:id])

        wcif_event[:rounds].each do |wcif_round|
          competition_round = competition_event.rounds.find { it.wcif_id == wcif_round[:id] }

          wcif_round[:scrambleSets].each_with_index do |wcif_scramble_set, idx|
            scramble_set = scr_file_upload.inbox_scramble_sets.create!(
              ordered_index: idx,
              matched_round: competition_round,
            )

            wcif_scramble_set[:scrambles].each_with_index do |wcif_scramble, n|
              scramble_set.inbox_scrambles.create!(
                scramble_string: wcif_scramble,
                scramble_number: n + 1,
              )
            end

            wcif_scramble_set[:extraScrambles].each_with_index do |wcif_extra_scramble, n|
              scramble_set.inbox_scrambles.create!(
                scramble_string: wcif_extra_scramble,
                scramble_number: n + 1,
                is_extra: true,
              )
            end
          end
        end
      end
    end

    render json: { success: :ok, scramble_file: scr_file_upload }
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
