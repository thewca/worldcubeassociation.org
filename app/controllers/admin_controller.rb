# frozen_string_literal: true

require 'csv'

class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, except: [:all_voters, :leader_senior_voters]
  before_action -> { redirect_to_root_unless_user(:can_see_eligible_voters?) }, only: [:all_voters, :leader_senior_voters]

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

  def check_competition_results
    with_results_validator do
      @competition = competition_from_params
    end
  end

  def with_results_validator
    # For this view, we just build an empty validator: the WRT will decide what
    # to actually run (by default all validators will be selected).
    @results_validator = ResultsValidators::CompetitionsResultsValidator.new(check_real_results: true)
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
      newcomer_person: InboxPerson.where(wca_id: ''),
      newcomer_result: Result.select(:person_id).distinct.where("person_id REGEXP '^[0-9]+$'"),
    }

    @existing_data = data_tables.transform_values { |table| table.where(competition_id: @competition.id).count }
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

        person_id = inbox_person&.wca_id.presence || inbox_res.person_id
        person_country = inbox_person&.country

        {
          pos: inbox_res.pos,
          person_id: person_id,
          person_name: inbox_res.person_name,
          country_id: person_country.id,
          competition_id: inbox_res.competition_id,
          event_id: inbox_res.event_id,
          round_type_id: inbox_res.round_type_id,
          format_id: inbox_res.format_id,
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
        Result.where(competition_id: @competition.id, event_id: event_id, round_type_id: round_type_id).destroy_all
      when Scramble.name
        Scramble.where(competition_id: @competition.id, event_id: event_id, round_type_id: round_type_id).destroy_all
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
      @competition.update!(results_submitted_at: Time.now) if @competition.results_submitted_at.nil?
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

  def person_data
    @person = Person.current.find_by!(wca_id: params[:person_wca_id])

    render json: {
      name: @person.name,
      country_id: @person.country_id,
      gender: @person.gender,
      dob: @person.dob,
      incorrect_wca_id_claim_count: @person.incorrect_wca_id_claim_count,
    }
  end

  def do_compute_auxiliary_data
    ComputeAuxiliaryData.perform_later
    redirect_to panel_page_path(id: User.panel_pages[:computeAuxiliaryData])
  end

  def override_regional_records
    action_params = params.require(:check_regional_records_form)
                          .permit(:competition_id, :event_id, :refresh_index)

    @check_records_request = CheckRegionalRecordsForm.new(action_params)
    @check_results = @check_records_request.run_check
  end

  def do_override_regional_records
    ActiveRecord::Base.transaction do
      params[:regional_record_overrides].each do |id_and_type, marker|
        next if [:competition_id, :event_id].include? id_and_type.to_sym

        next if marker.blank?

        result_id, result_type = id_and_type.split('-')
        record_marker = :"regional#{result_type}Record"

        Result.where(id: result_id).update_all(record_marker => marker)
      end
    end

    competition_id = params.dig(:regional_record_overrides, :competition_id)
    event_id = params.dig(:regional_record_overrides, :event_id)

    redirect_to panel_page_path(id: User.panel_pages[:checkRecords], competition_id: competition_id, event_id: event_id)
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
    Competition.includes(associations).find(params[:competition_id])
  end

  private def competition_list_from_string(competition_ids_string)
    competition_ids_string.split(',').uniq.compact
  end

  def complete_persons
    @competition_ids_string = params.fetch(:competition_ids, "")
    @competition_ids = competition_list_from_string(@competition_ids_string)
    @persons_to_finish = FinishUnfinishedPersons.search_persons(@competition_ids)

    return unless @persons_to_finish.empty?

    flash[:warning] = "There are no persons to complete for the selected competition"
    redirect_to panel_page_path(id: User.panel_pages[:createNewComers], competition_ids: @competition_ids)
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
            old_country = inbox_person.country_id
          end

          FinishUnfinishedPersons.insert_person(inbox_person, new_name, new_country, new_id)
          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_id, new_name, new_country, pending_competition_id)
        else
          action, merge_id = procedure[:action].split '-'
          raise "Invalid action: #{action}" unless action == "merge"

          # Has to exist because otherwise there would be nothing to merge
          new_person = Person.find(merge_id)

          FinishUnfinishedPersons.adapt_results(pending_person_id.presence, old_name, old_country, new_person.wca_id, new_person.name, new_person.country_id, pending_competition_id)
        end
      end
    end

    continue_batch = params.dig(:person_completions, :continue_batch)
    continue_batch = ActiveRecord::Type::Boolean.new.cast(continue_batch)

    competition_ids = params.dig(:person_completions, :competition_ids)

    if continue_batch
      can_continue = FinishUnfinishedPersons.unfinished_results_scope(competition_list_from_string(competition_ids)).any?

      return redirect_to action: :complete_persons, competition_ids: competition_ids if can_continue
    end

    redirect_to panel_page_path(id: User.panel_pages[:createNewComers], competition_ids: competition_ids)
  end

  def peek_unfinished_results
    @person_name = params.require(:person_name)
    @country_id = params.require(:country_id)
    @person_id = params.require(:person_id)

    all_results = Result.select("results.*, FALSE AS `muted`")
                        .joins(:event, :round_type)
                        .where(
                          person_name: @person_name,
                          country_id: @country_id,
                          person_id: @person_id,
                        )
                        .order("events.rank, round_types.rank DESC")

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
