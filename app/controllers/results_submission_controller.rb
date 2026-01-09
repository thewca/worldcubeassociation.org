# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }, except: %i[newcomer_checks last_duplicate_checker_job_run compute_potential_duplicates newcomer_name_format_check newcomer_dob_check]
  before_action -> { redirect_to_root_unless_user(:can_check_newcomers_data?, competition_from_params) }, only: %i[newcomer_checks last_duplicate_checker_job_run compute_potential_duplicates newcomer_name_format_check newcomer_dob_check]

  def new
    @competition = competition_from_params

    expected_feature_flag = ServerSetting.find_by(name: ServerSetting::WCA_LIVE_BETA_FEATURE_FLAG)
    @show_wca_live_beta = expected_feature_flag.present? && params[:wcaLiveBeta] == expected_feature_flag.value
  end

  def newcomer_checks
    @competition = competition_from_params
  end

  def last_duplicate_checker_job_run
    last_job_run = DuplicateCheckerJobRun.find_by(competition_id: params.require(:competition_id))

    render status: :ok, json: last_job_run
  end

  def newcomer_name_format_check
    competition = competition_from_params

    name_format_issues = competition.accepted_newcomers.filter_map do |user|
      issues = ResultsValidators::PersonsValidator.name_validations(user.name)

      if issues.present?
        {
          id: user.id,
          name: user.name,
          issues: issues,
        }
      end
    end

    render status: :ok, json: name_format_issues
  end

  def newcomer_dob_check
    competition = competition_from_params

    dob_issues = competition.accepted_newcomers.flat_map do |user|
      ResultsValidators::PersonsValidator.dob_validations(user.dob, nil, name: user.name)
    end

    render status: :ok, json: dob_issues
  end

  def compute_potential_duplicates
    last_job_run = DuplicateCheckerJobRun.find_by(competition_id: params.require(:competition_id))
    job_run_running_too_long = last_job_run&.run_status_not_started? || last_job_run&.run_status_in_progress?

    last_job_run.update!(run_status: DuplicateCheckerJobRun.run_statuses[:long_running_uncertain]) if job_run_running_too_long

    job_run = DuplicateCheckerJobRun.create!(competition_id: params.require(:competition_id))
    ComputePotentialDuplicates.perform_later(job_run)

    render status: :ok, json: job_run
  end

  def upload_scrambles
    @competition = Competition.includes(
      scramble_file_uploads: ScrambleFileUpload::SERIALIZATION_INCLUDES,
      **ScrambleFileUpload::SERIALIZATION_INCLUDES,
    ).find(params[:competition_id])
  end

  def upload_json
    competition = competition_from_params

    # Only admins can upload results for the competitions where results are already submitted.
    if competition.results_submitted? && !current_user.can_admin_results?
      return render status: :unprocessable_content, json: {
        error: "Results have already been submitted for this competition.",
      }
    end

    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json = UploadJson.new({
                                   results_file: params.require(:results_file),
                                   competition_id: competition.id,
                                 })

    mark_result_submitted = ActiveRecord::Type::Boolean.new.cast(params.require(:mark_result_submitted))
    store_uploaded_json = ActiveRecord::Type::Boolean.new.cast(params.require(:store_uploaded_json))

    return render status: :unprocessable_content, json: { error: upload_json.errors.full_messages } unless upload_json.valid?

    temporary_results_data = upload_json.temporary_results_data

    errors = CompetitionResultsImport.import_temporary_results(
      competition,
      temporary_results_data,
      UploadedJson.upload_types[:results_json],
      mark_result_submitted: mark_result_submitted,
      store_uploaded_json: store_uploaded_json,
      results_json_str: upload_json.results_json_str,
    )

    return render status: :unprocessable_content, json: { error: errors } if errors.any?

    render status: :ok, json: { success: true }
  end

  def import_from_live
    competition = competition_from_params

    # Only admins can upload results for the competitions where results are already submitted.
    if competition.results_submitted? && !current_user.can_admin_results?
      return render status: :unprocessable_content, json: {
        error: "Results have already been submitted for this competition.",
      }
    end

    results_to_import = competition.rounds.flat_map do |round|
      round.round_results.map do |result|
        InboxResult.new({
                          competition: competition,
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

    persons_to_import = competition.registrations
                                   .includes(:user)
                                   .select { it.wcif_status == "accepted" && person_with_results.include?(it.registrant_id.to_s) }
                                   .map do |registration|
      InboxPerson.new({
                        id: [registration.registrant_id, competition.id],
                        wca_id: registration.wca_id || '',
                        name: registration.name,
                        country_iso2: registration.country.iso2,
                        gender: registration.gender,
                        dob: registration.dob,
                      })
    end

    scrambles_to_import = competition.matched_scramble_sets.flat_map do |scramble_set|
      extra_scrambles, std_scrambles = scramble_set.matched_inbox_scrambles.partition(&:is_extra?)

      [std_scrambles, extra_scrambles].flat_map do |scramble_family|
        scramble_family.map.with_index do |scramble, idx|
          Scramble.new({
                         competition_id: competition.id,
                         event_id: scramble_set.event_id,
                         round_type_id: scramble_set.round_type_id,
                         round_id: scramble_set.matched_round_id,
                         group_id: scramble_set.alphabetic_group_index,
                         is_extra: scramble.is_extra?,
                         scramble_num: idx + 1,
                         scramble: scramble.scramble_string,
                       })
        end
      end
    end

    temporary_results_data = {
      results_to_import: results_to_import,
      scrambles_to_import: scrambles_to_import,
      persons_to_import: persons_to_import,
    }

    mark_result_submitted = ActiveRecord::Type::Boolean.new.cast(params.require(:mark_result_submitted))
    store_uploaded_json = ActiveRecord::Type::Boolean.new.cast(params.require(:store_uploaded_json))

    errors = CompetitionResultsImport.import_temporary_results(
      competition,
      temporary_results_data,
      UploadedJson.upload_types[:wca_live],
      mark_result_submitted: mark_result_submitted,
      store_uploaded_json: store_uploaded_json,
      # The "traditional" Results JSON also contains personal data like DOB,
      #   so it is fine to hard-code the `authorized: true` here.
      # It is intentional and desired that WRT (who have admin power to view DOBs anyway)
      #   can reconstruct personal information from the moment the upload happened.
      results_json_str: competition.to_wcif(authorized: true).to_json,
    )

    return render status: :unprocessable_content, json: { error: errors } if errors.any?

    render status: :ok, json: { success: true }
  end

  def create
    competition = competition_from_params
    message = params.require(:message)
    results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation.validate(competition.id)

    return render status: :unprocessable_content, json: { error: "Submitted results contain errors." } if results_validator.any_errors?

    if competition.tickets_competition_result.present? && !competition.tickets_competition_result.aborted?
      return render status: :unprocessable_content, json: {
        error: "There is already a ticket associated with this, hence the results can be resubmitted only if the previous posting has been cancelled by WRT.",
      }
    end

    CompetitionsMailer.results_submitted(competition, results_validator, message, current_user).deliver_now

    ActiveRecord::Base.transaction do
      competition.touch(:results_submitted_at)
      if competition.tickets_competition_result.present?
        competition.tickets_competition_result.update!(
          status: TicketsCompetitionResult.statuses[:submitted],
          delegate_message: message,
        )
      else
        TicketsCompetitionResult.create_ticket!(competition, message, current_user)
      end
    end

    render status: :ok, json: { success: true }
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
