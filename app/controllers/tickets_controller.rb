# frozen_string_literal: true

class TicketsController < ApplicationController
  include Rails::Pagination

  before_action :authenticate_user!
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsCompetitionResult::ACTION_TYPE[:verify_warnings]) }, only: [:verify_warnings]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsCompetitionResult::ACTION_TYPE[:merge_inbox_results]) }, only: [:merge_inbox_results]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:approve_edit_person_request]) }, only: [:approve_edit_person_request]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:reject_edit_person_request]) }, only: [:reject_edit_person_request]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:sync_edit_person_request]) }, only: [:sync_edit_person_request]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: %i[delete_inbox_persons]

  SORT_WEIGHT_LAMBDAS = {
    createdAt:
      ->(ticket) { ticket.created_at },
  }.freeze

  private def check_ticket_errors(action_type, metadata_action = nil)
    @action_type = action_type
    @metadata_action = metadata_action
    @ticket = Ticket.find(params.require(:ticket_id))
    @acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    render status: :bad_request, json: { error: "You are not a stakeholder for this ticket." } unless @ticket.user_stakeholders(current_user).include?(@acting_stakeholder)

    # Actions which are not metadata-actions are allowed for all stakeholders currently.
    return if metadata_action.nil?

    render status: :unauthorized, json: { error: "You are not allowed to perform this metadata action." } unless @acting_stakeholder.metadata_actions_allowed.include?(@metadata_action)
  end

  def index
    tickets = Ticket

    # Filter based on params
    type = params[:type]
    tickets = tickets.where(metadata_type: type) if type

    status = params[:status]
    tickets = tickets.select do |ticket|
      if status
        ticket.metadata&.status == status
      else
        true
      end
    end

    # Filter based on current_user's permission
    tickets = tickets.select do |ticket|
      ticket.can_user_access?(current_user)
    end

    # Sort
    sort_param = params[:sort] || ''
    tickets = sort(tickets, sort_param, SORT_WEIGHT_LAMBDAS)

    # paginate won't help in improving efficiency here because we are fetching all the tickets
    # and then filtering and sorting them. We can't use the database to do this because the
    # filtering and sorting is based on the metadata of the ticket.
    # TODO: Check the feasibility of using the database to filter and sort the tickets.
    paginate json: tickets
  end

  def show
    respond_to do |format|
      format.html do
        @ticket_id = params.require(:id).to_i
        render :show
      end
      format.json do
        ticket = Ticket.find(params.require(:id))

        return head :unauthorized unless ticket.can_user_access?(current_user) || ticket.create_bcc_roles_if_eligible?(current_user)

        render json: {
          ticket: ticket,
          requester_stakeholders: ticket.user_stakeholders(current_user),
        }
      end
    end
  end

  def edit_person_validators
    ticket = Ticket.find(params.require(:ticket_id))
    name_validation_issues = []
    dob_validation_issues = []

    ticket.metadata.tickets_edit_person_fields.each do |edit_person_field|
      case edit_person_field[:field_name]
      when TicketsEditPersonField.field_names[:name]
        name_to_validate = edit_person_field[:new_value]
        name_validation_issues = ResultsValidators::PersonsValidator.name_validations(name_to_validate, nil)
      when TicketsEditPersonField.field_names[:dob]
        dob_to_validate = Date.parse(edit_person_field[:new_value])
        dob_validation_issues = ResultsValidators::PersonsValidator.dob_validations(dob_to_validate, nil, name: ticket.metadata.wca_id)
      end
    end

    render json: {
      name: name_validation_issues,
      dob: dob_validation_issues,
    }
  end

  private def user_and_person_from_params
    user_id = params[:userId]
    wca_id = params[:wcaId]

    if user_id && !wca_id
      user = User.find(user_id)
      person = user.person
    elsif !user_id && wca_id
      person = Person.find_by(wca_id: wca_id)
      user = person.user
    elsif user_id && wca_id
      person = Person.find_by(wca_id: wca_id)
      user = User.find(user_id)
    end
    [user, person]
  end

  before_action :check_errors, only: %i[details_before_anonymization anonymize]

  private def check_errors
    @user, @person = user_and_person_from_params

    if @user.present? && @person.present? && @person.user != @user
      render status: :unprocessable_content, json: {
        error: "Person and user not linked.",
      }
    elsif @user.nil? && @person.nil?
      render status: :unprocessable_content, json: {
        error: "User ID and WCA ID is not provided.",
      }
    end
  end

  def details_before_anonymization
    person_private_attributes = @person&.private_attributes_for_user(current_user)

    user_anonymization_checks, user_message_args = @user&.anonymization_checks_with_message_args
    person_anonymization_checks, person_message_args = @person&.anonymization_checks_with_message_args

    anonymization_checks = (user_anonymization_checks || {}).merge(person_anonymization_checks || {})
    message_args = (user_message_args || {}).merge(person_message_args || {})

    action_items, non_action_items = anonymization_checks
                                     .partition { |_, value| value }
                                     .map { |checks| checks.map(&:first) }

    render json: {
      user: @user,
      person: @person&.as_json(private_attributes: person_private_attributes),
      action_items: action_items,
      non_action_items: non_action_items,
      message_args: message_args,
    }
  end

  def anonymize
    if @user&.banned?
      return render status: :unprocessable_content, json: {
        error: "Error anonymizing: This person is currently banned and cannot be anonymized.",
      }
    end

    if @user.present? && @person.present?
      users_to_anonymize = User.where(id: @user.id).or(User.where(unconfirmed_wca_id: @person.wca_id))
    elsif @user.present? && @person.nil?
      users_to_anonymize = User.where(id: @user.id)
    elsif @user.nil? && @person.present?
      users_to_anonymize = User.where(unconfirmed_wca_id: @person.wca_id)
    end

    ActiveRecord::Base.transaction do
      new_wca_id = @person&.anonymize
      users_to_anonymize.each { it.anonymize(new_wca_id) }
    end

    render json: {
      success: true,
      new_wca_id: @person&.reload&.wca_id, # Reload to get the new wca_id
    }
  end

  def imported_temporary_results
    competition = Competition.find(params.require(:competition_id))

    render json: competition.inbox_results.includes(:inbox_person)
  end

  def verify_warnings
    ActiveRecord::Base.transaction do
      @ticket.metadata.update!(status: TicketsCompetitionResult.statuses[:warnings_verified])
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: { success: true }
  end

  def merge_inbox_results
    ActiveRecord::Base.transaction do
      @ticket.metadata.merge_inbox_results
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: { success: true }
  end

  def inbox_person_summary
    ticket = Ticket.find(params.require(:ticket_id))
    competition = ticket.metadata.competition

    render status: :ok, json: {
      inbox_person_count: competition.inbox_persons.count,
      inbox_person_no_wca_id_count: competition.inbox_persons.where(wca_id: '').count,
      result_no_wca_id_count: competition.results.select(:person_id).distinct.where("person_id REGEXP '^[0-9]+$'").count,
    }
  end

  def delete_inbox_persons
    ticket = Ticket.find(params.require(:ticket_id))
    competition = ticket.metadata.competition

    ActiveRecord::Base.transaction do
      competition.inbox_persons.delete_all
      ticket.metadata.update!(status: TicketsCompetitionResult.statuses[:created_wca_ids])
    end

    render status: :ok, json: { success: true }
  end

  def post_results
    ticket = Ticket.find(params.require(:ticket_id))
    competition = ticket.metadata.competition

    error = CompetitionResultsImport.post_results_error(competition)
    return render status: :unprocessable_content, json: { error: error } if error

    CompetitionResultsImport.post_results(competition, current_user)

    render status: :ok, json: ticket
  end

  def events_merged_data
    ticket = Ticket.find(params.require(:ticket_id))
    competition = ticket.metadata.competition

    rounds_data = competition.rounds.sort_by { |r| [r.event_id, r.round_type.rank] }.map do |round|
      {
        round_id: round.id,
        round_name: round.name,
        count: {
          result: round.results.count,
          scramble: round.scrambles.count,
        },
      }
    end

    render status: :ok, json: rounds_data
  end

  def approve_edit_person_request
    change_type = params.require(:change_type)
    person = @ticket.metadata.person
    edit_params = @ticket.metadata.tickets_edit_person_fields.to_h do |edit_person_field|
      # Temporary hack till we migrate to using country_iso2 everywhere
      if edit_person_field.field_name == TicketsEditPersonField.field_names[:country_iso2]
        ['country_id', Country.c_find_by_iso2(edit_person_field.new_value).id]
      else
        [edit_person_field.field_name, edit_person_field.new_value]
      end
    end

    ticket_status = TicketsEditPerson.statuses[:closed]

    if @ticket.metadata.out_of_sync?
      return render status: :unprocessable_content, json: {
        error: "The person's data has changed since this request was created. Please sync the request before approving it.",
      }
    end

    ActiveRecord::Base.transaction do
      person.execute_edit_person_request(change_type, edit_params)
      @ticket.metadata.update!(status: ticket_status)
      ticket_log = @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
      ticket_log.ticket_log_changes.create!(
        field_name: TicketLogChange.field_names[:status],
        field_value: ticket_status,
      )
    end
    render status: :ok, json: { success: true }
  end

  def reject_edit_person_request
    ActiveRecord::Base.transaction do
      ticket_status = TicketsEditPerson.statuses[:closed]
      @ticket.metadata.update!(status: ticket_status)
      ticket_log = @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
      ticket_log.ticket_log_changes.create!(
        field_name: TicketLogChange.field_names[:status],
        field_value: ticket_status,
      )
    end
    render status: :ok, json: { success: true }
  end

  def sync_edit_person_request
    person = @ticket.metadata.person
    any_request_still_valid = @ticket.metadata.tickets_edit_person_fields.any? do |edit_person_field|
      person.send(edit_person_field.field_name).to_s != edit_person_field.new_value
    end

    unless any_request_still_valid
      return render status: :unprocessable_content, json: {
        error: "All requested changes have already been applied. If you think this is correct, please reject the request.",
      }
    end

    ActiveRecord::Base.transaction do
      @ticket.metadata.tickets_edit_person_fields.each do |edit_person_field|
        if person.send(edit_person_field.field_name).to_s == edit_person_field.new_value
          edit_person_field.delete
        else
          edit_person_field.update!(old_value: person.send(edit_person_field.field_name).to_s)
        end
      end
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: @ticket
  end
end
