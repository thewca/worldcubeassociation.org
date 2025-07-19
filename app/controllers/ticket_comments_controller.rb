# frozen_string_literal: true

class TicketCommentsController < ApplicationController
  before_action :authenticate_user!

  def index
    ticket = Ticket.find(params.require(:ticket_id))

    # Currently only stakeholders can access the ticket comments.
    return head :unauthorized unless ticket.can_user_access?(current_user)

    comments = ticket.ticket_comments.order(created_at: :desc)
    render json: comments
  end

  def create
    ticket, acting_stakeholder = ticket_and_acting_stakeholder_from_params
    return if check_ticket_errors(ticket, acting_stakeholder, TicketLog.action_types[:create_comment])

    comment = TicketComment.create!(
      ticket: ticket,
      comment: params.require(:comment),
      acting_user_id: current_user.id,
      acting_stakeholder_id: acting_stakeholder.id,
    )

    render json: comment
  end

  private def ticket_and_acting_stakeholder_from_params
    ticket = Ticket.find(params.require(:ticket_id))
    acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    [ticket, acting_stakeholder]
  end

  private def check_ticket_errors(ticket, acting_stakeholder, action)
    unless ticket.user_stakeholders(current_user).include?(acting_stakeholder)
      render status: :bad_request, json: { error: "You are not a stakeholder for this ticket." }
      return true
    end

    unless acting_stakeholder.actions_allowed.include?(action)
      render status: :unauthorized, json: { error: "You are not allowed to perform this action." }
      return true
    end

    false
  end
end
