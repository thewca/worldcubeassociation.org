# frozen_string_literal: true

require 'fileutils'

class ResultsSubmissionController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_competition_results?, competition_from_params) }, except: %i[newcomer_checks last_duplicate_checker_job_run compute_potential_duplicates]
  before_action -> { redirect_to_root_unless_user(:can_check_newcomers_data?, competition_from_params) }, only: %i[newcomer_checks last_duplicate_checker_job_run compute_potential_duplicates]

  def new
    @competition = competition_from_params
    @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
    @results_validator.validate(@competition.id)
  end

  def newcomer_checks
    @competition = competition_from_params
  end

  def last_duplicate_checker_job_run
    last_job_run = DuplicateCheckerJobRun.find_by(competition_id: params.require(:competition_id))

    render status: :ok, json: last_job_run
  end

  def compute_potential_duplicates
    job_run = DuplicateCheckerJobRun.create!(competition_id: params.require(:competition_id))
    ComputePotentialDuplicates.perform_later(job_run)

    render status: :ok, json: job_run
  end

  def upload_json
    competition = competition_from_params

    # Only admins can upload results for the competitions where results are already submitted.
    if competition.results_submitted? && !current_user.can_admin_results?
      return render status: :unprocessable_entity, json: {
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

    # This makes sure the json structure is valid!
    return render status: :unprocessable_entity, json: { error: upload_json.errors.full_messages } unless upload_json.import_to_inbox

    competition.touch(:results_submitted_at) if !competition.results_submitted? && mark_result_submitted
    competition.uploaded_jsons.create!(json_str: upload_json.results_json_str) if store_uploaded_json

    render status: :ok, json: { success: true }
  end

  def import_from_live
    competition = competition_from_params

    # Only admins can upload results for the competitions where results are already submitted.
    if competition.results_submitted? && !current_user.can_admin_results?
      return render status: :unprocessable_entity, json: {
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
                                   .map do
      InboxPerson.new({
                        id: it.registrant_id,
                        wca_id: it.wca_id || '',
                        competition_id: competition.id,
                        name: it.name,
                        country_iso2: it.country.iso2,
                        gender: it.gender,
                        dob: it.dob,
                      })
    end

    scrambles_to_import = InboxScrambleSet.where(competition_id: competition.id).flat_map do |scramble_set|
      scramble_set.inbox_scrambles.map do |scramble|
        Scramble.new({
                       competition_id: competition.id,
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
      InboxPerson.where(competition_id: competition.id).delete_all
      InboxResult.where(competition_id: competition.id).delete_all
      Scramble.where(competition_id: competition.id).delete_all
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

    return render status: :unprocessable_entity, json: { error: errors } if errors.any?

    render status: :ok, json: { success: true }
  end

  def create
    competition = competition_from_params
    message = params.require(:message)
    results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation.validate(competition.id)

    return render status: :unprocessable_entity, json: { error: "Submitted results contain errors." } if results_validator.any_errors?

    return render status: :unprocessable_entity, json: { error: "There is already a ticket associated, please contact WRT to update this." } if competition.result_ticket.present?

    CompetitionsMailer.results_submitted(competition, results_validator, message, current_user).deliver_now

    ActiveRecord::Base.transaction do
      competition.touch(:results_submitted_at)
      TicketsCompetitionResult.create_ticket!(competition.id, message, current_user)
    end

    render status: :ok, json: { success: true }
  end

  private def competition_from_params
    Competition.find(params[:competition_id])
  end
end
