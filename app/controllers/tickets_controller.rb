# frozen_string_literal: true

class TicketsController < ApplicationController
  include Rails::Pagination

  before_action :authenticate_user!
  before_action -> { check_ticket_errors(TicketLog.action_types[:update_status]) }, only: [:update_status]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: %i[merge_temporary_results]

  SORT_WEIGHT_LAMBDAS = {
    createdAt:
      ->(ticket) { ticket.created_at },
  }.freeze

  private def check_ticket_errors(action_type)
    @action_type = action_type
    @ticket = Ticket.find(params.require(:ticket_id))
    @acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    render status: :bad_request, json: { error: "You are not a stakeholder for this ticket." } unless @ticket.user_stakeholders(current_user).include?(@acting_stakeholder)

    render status: :unauthorized, json: { error: "You are not allowed to perform this action." } unless @acting_stakeholder.actions_allowed.include?(@action_type)
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

        # Currently only stakeholders can access the ticket.
        return head :unauthorized unless ticket.can_user_access?(current_user)

        render json: {
          ticket: ticket,
          requester_stakeholders: ticket.user_stakeholders(current_user),
        }
      end
    end
  end

  def update_status
    ticket_status = params.require(:ticket_status)

    ActiveRecord::Base.transaction do
      @ticket.metadata.update!(status: ticket_status)
      ticket_log = @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
      )
      ticket_log.ticket_log_changes.create!(
        field_name: TicketLogChange.field_names[:status],
        field_value: ticket_status,
      )
    end
    render json: { success: true }
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
      render status: :unprocessable_entity, json: {
        error: "Person and user not linked.",
      }
    elsif @user.nil? && @person.nil?
      render status: :unprocessable_entity, json: {
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
      return render status: :unprocessable_entity, json: {
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

  def merge_temporary_results
    ticket = Ticket.find(params.require(:ticket_id))
    CompetitionResultsImport.merge_temporary_results(ticket)

    render status: :ok, json: { success: true }
  end
end
