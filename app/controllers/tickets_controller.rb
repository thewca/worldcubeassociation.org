# frozen_string_literal: true

class TicketsController < ApplicationController
  include Rails::Pagination

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
    dob_validation_issues = []

    ticket.metadata.tickets_edit_person_fields.each do |edit_person_field|
      case edit_person_field[:field_name]
      when TicketsEditPersonField.field_names[:dob]
        dob_validation_issues = ResultsValidators::PersonsValidator.dob_validations(Date.parse(edit_person_field[:new_value]))
      end
    end

    render json: { dob: dob_validation_issues }
  end
end
