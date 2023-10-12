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

  def compute_validation_competitions
    validation_form = ResultValidationForm.new(
      competition_start_date: params[:start_date],
      competition_end_date: params[:end_date],
      competition_selection: ResultValidationForm::COMP_VALIDATION_ALL,
    )

    render json: {
      competitions: validation_form.competitions,
    }
  end

  def with_results_validator
    @result_validation = ResultValidationForm.new(
      competition_ids: params[:competition_ids] || "",
      competition_start_date: params[:competition_start_date] || "",
      competition_end_date: params[:competition_end_date] || "",
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
                          .permit(:competition_ids, :validator_classes, :apply_fixes, :competition_selection, :competition_start_date, :competition_end_date)

    @result_validation = ResultValidationForm.new(action_params)

    if @result_validation.valid?
      @results_validator = @result_validation.build_and_run
    else
      @results_validator = ResultsValidators::CompetitionsResultsValidator.new(check_real_results: true)
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
      flash[:danger] = "Could not clear the results submission. Maybe results are already posted, or there is no submission."
    end
    redirect_to competition_admin_upload_results_edit_path
  end

  # The order of this array has to follow the steps in which results have to be imported.
  RESULTS_POSTING_STEPS = %i[inbox_result inbox_person].freeze

  private def load_result_posting_steps
    @competition = competition_from_params(associations: [:events, :rounds])

    data_tables = {
      result: Result,
      scramble: Scramble,
      inbox_result: InboxResult,
      inbox_person: InboxPerson,
      newcomer_person: InboxPerson.where(wcaId: ''),
      newcomer_result: Result.select(:personId).distinct.where("personId REGEXP '^[0-9]+$'"),
    }

    @existing_data = data_tables.transform_values { |table| table.where(competitionId: @competition.id).count }
    @inbox_step = RESULTS_POSTING_STEPS.find { |inbox| @existing_data[inbox] > 0 }

    yield if block_given?
  end

  def import_results
    @competition = competition_from_params
    load_result_posting_steps
  end

  def result_inbox_steps
    load_result_posting_steps do
      render partial: 'import_results_steps'
    end
  end

  def import_inbox_results
    @competition = competition_from_params

    ActiveRecord::Base.transaction do
      result_rows = @competition.inbox_results
                                .includes(:inbox_person)
                                .map do |inbox_res|
        inbox_person = inbox_res.inbox_person

        person_id = inbox_person&.wcaId.presence || inbox_res.personId
        person_country = Country.find_by_iso2(inbox_person&.countryId)

        {
          pos: inbox_res.pos,
          personId: person_id,
          personName: inbox_res.personName,
          countryId: person_country.id,
          competitionId: inbox_res.competitionId,
          eventId: inbox_res.eventId,
          roundTypeId: inbox_res.roundTypeId,
          formatId: inbox_res.formatId,
          value1: inbox_res.value1,
          value2: inbox_res.value2,
          value3: inbox_res.value3,
          value4: inbox_res.value4,
          value5: inbox_res.value5,
          best: inbox_res.best,
          average: inbox_res.average,
        }
      end

      Result.insert_all!(result_rows)
      @competition.inbox_results.destroy_all
    end

    load_result_posting_steps do
      render partial: 'import_results_steps'
    end
  end

  def delete_inbox_data
    @competition = competition_from_params

    inbox_model = params.require(:model).to_sym

    case inbox_model
    when :inbox_result
      @competition.inbox_results.destroy_all
    when :inbox_person
      # Ugly hack because we don't have primary keys on InboxPerson, also see comment on `InboxPerson#delete`
      @competition.inbox_persons.each(&:delete)
    else
      raise "Invalid model association: #{inbox_model}"
    end

    load_result_posting_steps do
      render partial: 'import_results_steps'
    end
  end

  def delete_results_data
    @competition = competition_from_params

    model = params.require(:model)

    if model == 'All'
      @competition.results.destroy_all
      @competition.scrambles.destroy_all
    else
      event_id = params.require(:event_id)
      round_type_id = params.require(:round_type_id)

      case model
      when Result.name
        Result.where(competitionId: @competition.id, eventId: event_id, roundTypeId: round_type_id).destroy_all
      when Scramble.name
        Scramble.where(competitionId: @competition.id, eventId: event_id, roundTypeId: round_type_id).destroy_all
      else
        raise "Invalid table: #{params[:table]}"
      end
    end

    load_result_posting_steps do
      render partial: 'import_results_steps'
    end
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

  def fix_results
    @result_selector = FixResultsSelector.new(
      person_id: params[:person_id],
      competition_id: params[:competition_id],
      event_id: params[:event_id],
      round_type_id: params[:round_type_id],
    )
  end

  def fix_results_selector
    action_params = params.require(:fix_results_selector)
                          .permit(:person_id, :competition_id, :event_id, :round_type_id)

    @result_selector = FixResultsSelector.new(action_params)

    render partial: "fix_results_selector"
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
            <a href='#{admin_check_regional_records_path}'>check_regional_record_markers</a>.".html_safe
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
  end

  def do_compute_auxiliary_data
    ComputeAuxiliaryData.perform_later
    redirect_to admin_compute_auxiliary_data_path
  end

  def generate_exports
  end

  def do_generate_dev_export
    DumpDeveloperDatabase.perform_later
    redirect_to admin_generate_exports_path
  end

  def do_generate_public_export
    DumpPublicResultsDatabase.perform_later
    redirect_to admin_generate_exports_path
  end

  def generate_db_token
    @db_endpoints = {
      main: EnvConfig.DATABASE_HOST,
      replica: EnvConfig.READ_REPLICA_HOST,
    }

    role_credentials = Aws::InstanceProfileCredentials.new
    token_generator = Aws::RDS::AuthTokenGenerator.new credentials: role_credentials

    @db_tokens = @db_endpoints.transform_values do |url|
      token_generator.auth_token({
                                   region: EnvConfig.DATABASE_AWS_REGION,
                                   endpoint: "#{url}:3306",
                                   user_name: EnvConfig.DATABASE_WRT_USER,
                                 })
    end

    @default_token = @db_tokens[:main]
  end

  def check_regional_records
    @check_records_request = CheckRegionalRecordsForm.new(
      competition_id: params[:competition_id] || nil,
      event_id: params[:event_id] || nil,
    )
  end

  def override_regional_records
    action_params = params.require(:check_regional_records_form)
                          .permit(:competition_id, :event_id)

    @check_records_request = CheckRegionalRecordsForm.new(action_params)
    @check_results = @check_records_request.run_check
  end

  def do_override_regional_records
    ActiveRecord::Base.transaction do
      params[:regional_record_overrides].each do |id_and_type, marker|
        next if [:competition_id, :event_id].include? id_and_type.to_sym

        next unless marker.present?

        result_id, result_type = id_and_type.split('-')
        record_marker = "regional#{result_type}Record".to_sym

        Result.where(id: result_id).update_all(record_marker => marker)
      end
    end

    competition_id = params.dig(:regional_record_overrides, :competition_id)
    event_id = params.dig(:regional_record_overrides, :event_id)

    redirect_to action: :check_regional_records, competition_id: competition_id, event_id: event_id
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

  private def competition_from_params(associations: {})
    Competition.includes(associations).find_by_id!(params[:competition_id])
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

  def finish_unfinished_persons
    @finish_persons = FinishPersonsForm.new(
      competition_ids: params[:competition_ids] || nil,
    )
  end

  def complete_persons
    action_params = params.require(:finish_persons_form)
                          .permit(:competition_ids)

    @finish_persons = FinishPersonsForm.new(action_params)
    @persons_to_finish = @finish_persons.search_persons

    if @persons_to_finish.empty?
      flash[:warning] = "There are no persons to complete for the selected competition"
      redirect_to action: :finish_unfinished_persons
    end
  end

  def do_complete_persons
    # memoize all WCA IDs, especially useful if we have several identical semi-IDs in the same batch
    # (siblings with the same last name competing as newcomers at the same competition etc.)
    wca_id_index = Person.pluck(:wca_id)

    ActiveRecord::Base.transaction do
      params[:person_completions].each do |person_key, procedure|
        next if [:competition_ids, :continue_batch].include? person_key.to_sym

        old_name, old_country, pending_person_id, pending_competition_id = person_key.split '|'

        case procedure[:action]
        when "skip"
          next
        when "create"
          new_semi_id = procedure[:new_semi_id]

          new_id, wca_id_index = FinishUnfinishedPersons.complete_wca_id(new_semi_id, wca_id_index)

          new_name = procedure[:new_name]
          new_country = procedure[:new_country]

          inbox_person = nil

          if pending_person_id.present?
            inbox_person = InboxPerson.find_by(id: pending_person_id, competition_id: pending_competition_id)

            old_name = inbox_person.name
            old_country = inbox_person.countryId
          end

          FinishUnfinishedPersons.insert_person(inbox_person, new_name, new_country, new_id)
          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_id, new_name, new_country, pending_competition_id)
        else
          action, merge_id = procedure[:action].split '-'
          raise "Invalid action: #{action}" unless action == "merge"

          # Has to exist because otherwise there would be nothing to merge
          new_person = Person.find(merge_id)

          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_person.wca_id, new_person.name, new_person.countryId, pending_competition_id)
        end
      end
    end

    continue_batch = params.dig(:person_completions, :continue_batch)
    continue_batch = ActiveRecord::Type::Boolean.new.cast(continue_batch)

    competition_ids = params.dig(:person_completions, :competition_ids)

    if continue_batch
      finish_persons = FinishPersonsForm.new(competition_ids: competition_ids)
      can_continue = FinishUnfinishedPersons.unfinished_results_scope(finish_persons.competitions).any?

      if can_continue
        return redirect_to action: :complete_persons, finish_persons_form: { competition_ids: competition_ids }
      end
    end

    redirect_to action: :finish_unfinished_persons, competition_ids: competition_ids
  end

  def peek_unfinished_results
    @person_name = params.require(:person_name)
    @country_id = params.require(:country_id)
    @person_id = params.require(:person_id)

    all_results = Result.select("Results.*, FALSE AS `muted`")
                        .joins(:event, :round_type)
                        .where(
                          personName: @person_name,
                          countryId: @country_id,
                          personId: @person_id,
                        )
                        .order("Events.rank, RoundTypes.rank DESC")

    @results_by_competition = all_results.group_by(&:competition_id)
                                         .transform_keys { |id| Competition.find(id) }
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
