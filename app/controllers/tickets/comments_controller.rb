# frozen_string_literal: true

module Tickets
  class Tickets::CommentsController < ApplicationController
    def index
      ticket = Ticket.find(params.require(:ticket_id))

      # Currently only stakeholders can access the ticket comments.
      return head :unauthorized unless ticket.can_user_access?(current_user)

      render json: {
        comments: ticket.ticket_comments,
      }
    end

    def create
      ticket = Ticket.find(params.require(:ticket_id))
      acting_stakeholder_id = params.require(:acting_stakeholder_id)

      # Currently only stakeholders can create comments.
      return head :unauthorized unless ticket.can_user_access?(current_user)
      return head :bad_request unless ticket.user_stakeholders(current_user).map(&:id).include?(acting_stakeholder_id)

      TicketComment.create!(
        ticket: ticket,
        comment: params.require(:comment),
        acting_user_id: current_user.id,
        acting_stakeholder_id: acting_stakeholder_id,
      )

      render json: { success: true }
    end
  end
end
