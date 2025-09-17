# frozen_string_literal: true

class TicketCommentsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { check_ticket_errors(TicketLog.action_types[:create_comment]) }, only: [:create]

  private def check_ticket_errors(action_type)
    @action_type = action_type
    @ticket = Ticket.find(params.require(:ticket_id))
    @acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    render status: :bad_request, json: { error: "You are not a stakeholder for this ticket." } unless @ticket.user_stakeholders(current_user).include?(@acting_stakeholder)
  end

  def index
    ticket = Ticket.find(params.require(:ticket_id))

    # Currently only stakeholders can access the ticket comments.
    return head :unauthorized unless ticket.can_user_access?(current_user)

    comments = ticket.ticket_comments.order(created_at: :desc)
    render json: comments
  end

  def create
    comment = TicketComment.create!(
      ticket: @ticket,
      comment: params.require(:comment),
      acting_user_id: current_user.id,
      acting_stakeholder_id: @acting_stakeholder.id,
    )

    render json: comment
  end
end
