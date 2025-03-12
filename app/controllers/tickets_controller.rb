# frozen_string_literal: true

class TicketsController < ApplicationController
  include Rails::Pagination

  before_action :authenticate_user!

  SORT_WEIGHT_LAMBDAS = {
    createdAt:
      lambda { |ticket| ticket.created_at },
  }.freeze

  def index
    tickets = Ticket

    # Filter based on params
    type = params[:type]
    if type
      tickets = tickets.where(metadata_type: type)
    end

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
        @ticket_id = params.require(:id)
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
    ticket = Ticket.find(params.require(:ticket_id))
    ticket_status = params.require(:ticket_status)
    acting_stakeholder_id = params.require(:acting_stakeholder_id)

    return head :unauthorized unless ticket.action_allowed?(:update_status, current_user)
    return head :bad_request unless ticket.user_stakeholders(current_user).map(&:id).include?(acting_stakeholder_id)

    ActiveRecord::Base.transaction do
      ticket.metadata.update!(status: ticket_status)
      TicketLog.create!(
        ticket_id: ticket.id,
        action_type: TicketLog.action_types[:status_updated],
        action_value: ticket_status,
        acting_user_id: current_user.id,
        acting_stakeholder_id: acting_stakeholder_id,
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

  private def check_errors(user, person)
    if user.present? && person.present? && person&.user != user
      render status: :unprocessable_entity, json: {
        error: "Person and user not linked.",
      }
      true
    elsif user.nil? && person.nil?
      render status: :unprocessable_entity, json: {
        error: "User ID and WCA ID is not provided.",
      }
      true
    end
  end

  def details_before_anonymization
    user, person = user_and_person_from_params
    return if check_errors(user, person)

    user_anonymization_checks, user_message_args = user&.anonymization_checks_with_message_args
    person_anonymization_checks, person_message_args = person&.anonymization_checks_with_message_args

    anonymization_checks = (user_anonymization_checks || {}).merge(person_anonymization_checks || {})
    message_args = (user_message_args || {}).merge(person_message_args || {})

    action_items, non_action_items = anonymization_checks
                                     .partition { |_, value| value }
                                     .map { |checks| checks.map(&:first) }

    render json: {
      user: user,
      person: person,
      action_items: action_items,
      non_action_items: non_action_items,
      message_args: message_args,
    }
  end

  def anonymize
    user, person = user_and_person_from_params
    return if check_errors(user, person)

    if user&.banned?
      return render status: :unprocessable_entity, json: {
        error: "Error anonymizing: This person is currently banned and cannot be anonymized.",
      }
    end

    if user.present? && person.present?
      users_to_anonymize = User.where(id: user.id).or(User.where(unconfirmed_wca_id: person.wca_id))
    elsif user.present? && person.nil?
      users_to_anonymize = User.where(id: user.id)
    elsif user.nil? && person.present?
      users_to_anonymize = User.where(unconfirmed_wca_id: person.wca_id)
    end

    ActiveRecord::Base.transaction do
      person&.anonymize

      users_to_anonymize.each do |user_to_anonymize|
        user_to_anonymize.anonymize
      end
    end

    render json: {
      success: true,
      new_wca_id: person&.reload&.wca_id, # Reload to get the new wca_id
    }
  end
end
