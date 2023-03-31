# frozen_string_literal: true

require 'csv'

class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, except: [:all_voters, :leader_senior_voters]
  before_action -> { redirect_to_root_unless_user(:can_see_eligible_voters?) }, only: [:all_voters, :leader_senior_voters]

  before_action :compute_navbar_data
  def compute_navbar_data
    @pending_avatars_count = User.where.not(pending_avatar: nil).count
    @pending_media_count = CompetitionMedium.pending.count
  end

  def index
  end

  def merge_people
    @merge_people = MergePeople.new
  end

  def do_merge_people
    merge_params = params.require(:merge_people).permit(:person1_wca_id, :person2_wca_id)
    @merge_people = MergePeople.new(merge_params)
    if @merge_people.do_merge
      flash.now[:success] = "Successfully merged #{@merge_people.person2_wca_id} into #{@merge_people.person1_wca_id}!"
      @merge_people = MergePeople.new
    else
      flash.now[:danger] = "Error merging"
    end
    render 'merge_people'
  end

  def new_results
    @competition = competition_from_params
    @upload_json = UploadJson.new
    @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
    @results_validator.validate(@competition.id)
  end

  def check_results
    with_results_validator
  end

  def check_competition_results
    with_results_validator do
      @competition = competition_from_params
      @result_validation.competition_ids = @competition.id
    end
  end

  def compute_validation_range_end
    validation_form = ResultValidationForm.new(
      competition_start_date: params[:start_date],
      competition_count: params[:count],
      competition_selection: ResultValidationForm::COMP_VALIDATION_ALL,
    )

    competition_ids = validation_form.competitions

    render json: {
      rangeEnd: validation_form.competition_range_end,
      count: competition_ids.length,
      competitions: competition_ids,
    }
  end

  def with_results_validator
    @result_validation = ResultValidationForm.new(
      competition_ids: params[:competition_ids] || "",
      competition_start_date: params[:competition_start_date] || "",
      validator_classes: params[:validator_classes] || ResultValidationForm::ALL_VALIDATOR_NAMES.join(","),
      competition_selection: params[:competition_selection] || ResultValidationForm::COMP_VALIDATION_MANUAL,
      apply_fixes: params[:apply_fixes] || false,
    )

    # For this view, we just build an empty validator: the WRT will decide what
    # to actually run (by default all validators will be selected).
    @results_validator = ResultsValidators::CompetitionsResultsValidator.new(check_real_results: true)
    yield if block_given?
  end

  def do_check_results
    running_validators do
      render :check_results
    end
  end

  def do_check_competition_results
    running_validators do
      uniq_id = @result_validation.competitions.first
      @competition = Competition.find(uniq_id)

      render :check_competition_results
    end
  end

  def running_validators
    action_params = params.require(:result_validation_form)
                          .permit(:competition_ids, :validator_classes, :apply_fixes, :competition_selection, :competition_start_date, :competition_count)

    @result_validation = ResultValidationForm.new(action_params)

    if @result_validation.valid?
      @results_validator = @result_validation.build_and_run
    else
      @results_validator = @result_validation.build_validator
    end

    yield if block_given?
  end

  def clear_results_submission
    # Just clear the "results_submitted_at" field to let the Delegate submit
    # the results again. We don't actually want to clear InboxResult and InboxPerson.
    @competition = competition_from_params

    if @competition.results_submitted? && !@competition.results_posted?
      @competition.update(results_submitted_at: nil)
      flash[:success] = "Results submission cleared."
    else
      flash[:danger] = "Could not clear the results submission. Maybe results are alredy posted, or there is no submission."
    end
    redirect_to competition_admin_upload_results_edit_path
  end

  def create_results
    @competition = competition_from_params

    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)

    # This makes sure the json structure is valid!
    if @upload_json.import_to_inbox
      if @competition.results_submitted_at.nil?
        @competition.update!(results_submitted_at: Time.now)
      end
      flash[:success] = "JSON file has been imported."
      redirect_to competition_admin_upload_results_edit_path
    else
      @results_validator = ResultsValidators::CompetitionsResultsValidator.create_full_validation
      @results_validator.validate(@competition.id)
      render :new_results
    end
  end

  def edit_person
    @person = Person.current.find_by(wca_id: params[:person].try(:[], :wca_id))
    # If there isn't a person in the params, make an empty one that simple form have an object to work with.
    # Note: most of the time persons are dynamically selected using user_id picker.
    @person ||= Person.new
  end

  def update_person
    @person = Person.current.find_by(wca_id: params[:person][:wca_id])
    if @person
      person_params = params.require(:person).permit(:name, :countryId, :gender, :dob, :incorrect_wca_id_claim_count)
      case params[:method]
      when "fix"
        if @person.update(person_params)
          flash.now[:success] = "Successfully fixed #{@person.name}."
          if @person.saved_change_to_countryId?
            flash.now[:warning] = "The change you made may have affected national and continental records, be sure to run
            <a href='/results/admin/check_regional_record_markers.php'>check_regional_record_markers</a>.".html_safe
          end
        else
          flash.now[:danger] = "Error while fixing #{@person.name}."
        end
      when "update"
        if @person.update_using_sub_id(person_params)
          flash.now[:success] = "Successfully updated #{@person.name}."
        else
          flash.now[:danger] = "Error while updating #{@person.name}."
        end
      when "destroy"
        if @person.results.any?
          flash.now[:danger] = "#{@person.name} has results, can't destroy them."
        elsif @person.user.present?
          flash.now[:danger] = "#{@person.wca_id} is linked to a user, can't destroy them."
        else
          name = @person.name
          @person.destroy
          flash.now[:success] = "Successfully destroyed #{name}."
          @person = Person.new
        end
      end
    else
      @person = Person.new
      flash.now[:danger] = "No person has been chosen."
    end
    render :edit_person
  end

  def person_data
    @person = Person.current.find_by!(wca_id: params[:person_wca_id])

    render json: {
      name: @person.name,
      countryId: @person.countryId,
      gender: @person.gender,
      dob: @person.dob,
      incorrect_wca_id_claim_count: @person.incorrect_wca_id_claim_count,
    }
  end

  def compute_auxiliary_data
    @reason_not_to_run = ComputeAuxiliaryData.reason_not_to_run
  end

  def do_compute_auxiliary_data
    ComputeAuxiliaryData.perform_later unless ComputeAuxiliaryData.in_progress?
    redirect_to admin_compute_auxiliary_data_path
  end

  def all_voters
    voters User.eligible_voters, "all-wca-voters"
  end

  def leader_senior_voters
    voters User.leader_senior_voters, "leader-senior-wca-voters"
  end

  private def voters(users, filename)
    csv = CSV.generate do |line|
      users.each do |user|
        line << ["password", user.id, user.email, user.name]
        # Helios requires a voter_type field that must be set to "password". Note this is the literal string,
        # the actual passwords used on elections are generated by Helios
      end
    end
    send_data csv, filename: "#{filename}-#{Time.now.utc.iso8601}.csv", type: :csv
  end

  private def competition_from_params
    Competition.find_by_id!(params[:competition_id])
  end

  def anonymize_person
    session[:anonymize_params] = {}
    session[:anonymize_step] = nil
    @anonymize_person = AnonymizePerson.new(session[:anonymize_params])
    @anonymize_person.current_step = session[:anonymize_step]
  end

  def do_anonymize_person
    session[:anonymize_params].deep_merge!((params[:anonymize_person]).permit(:person_wca_id)) if params[:anonymize_person]
    @anonymize_person = AnonymizePerson.new(session[:anonymize_params])
    @anonymize_person.current_step = session[:anonymize_step]

    if @anonymize_person.valid?

      if params[:back_button]
        @anonymize_person.previous_step!
      elsif @anonymize_person.last_step?
        do_anonymize_person_response = @anonymize_person.do_anonymize_person

        if do_anonymize_person_response && !do_anonymize_person_response[:error] && do_anonymize_person_response[:new_wca_id]
          flash.now[:success] = "Successfully anonymized #{@anonymize_person.person_wca_id} to #{do_anonymize_person_response[:new_wca_id]}! Don't forget to run Compute Auxiliary Data and Export Public."
          @anonymize_person = AnonymizePerson.new
        else
          flash.now[:danger] = do_anonymize_person_response[:error] || "Error anonymizing"
        end

      else
        @anonymize_person.next_step!
      end

      session[:anonymize_step] = @anonymize_person.current_step
    end

    render 'anonymize_person'
  end

  def reassign_wca_id
    @reassign_wca_id = ReassignWcaId.new
    @reassign_wca_id_validated = false
  end

  def validate_reassign_wca_id
    reassign_params = params.require(:reassign_wca_id).permit(:account1, :account2)
    @reassign_wca_id = ReassignWcaId.new(reassign_params)
    if @reassign_wca_id.valid?
      @reassign_wca_id_validated = true
    else
      flash.now[:danger] = "Error reassigning WCA ID"
    end
    render 'reassign_wca_id'
  end

  def do_reassign_wca_id
    reassign_params = params.require(:reassign_wca_id).permit(:account1, :account2)
    @reassign_wca_id = ReassignWcaId.new(reassign_params)
    if @reassign_wca_id.do_reassign_wca_id
      flash.now[:success] = "Successfully reassigned #{@reassign_wca_id.account1_user.wca_id} from account #{@reassign_wca_id.account1_user.id} to #{@reassign_wca_id.account2_user.id}!"
      @reassign_wca_id = ReassignWcaId.new
    else
      @reassign_wca_id_validated = false
      flash.now[:danger] = "Error reassigning WCA ID"
    end
    render 'reassign_wca_id'
  end
end
