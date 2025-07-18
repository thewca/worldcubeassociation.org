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
    ticket = Ticket.find(params.require(:ticket_id))
    acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    return head :bad_request unless ticket.user_stakeholders(current_user).include?(acting_stakeholder)
    return head :unauthorized unless acting_stakeholder.actions_allowed.include?(:add_comment)

    comment = TicketComment.create!(
      ticket: ticket,
      comment: params.require(:comment),
      acting_user_id: current_user.id,
      acting_stakeholder_id: acting_stakeholder.id,
    )

    render json: comment
  end
end
