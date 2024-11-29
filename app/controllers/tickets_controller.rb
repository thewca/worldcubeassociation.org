# frozen_string_literal: true

class TicketsController < ApplicationController
  def show
    respond_to do |format|
      format.html do
        @ticket_id = params.require(:id)
        render :show
      end
      format.json do
        ticket = Ticket.find(params.require(:id))
        # requester_stakeholders will have the list of stakeholders where the requester is part of.
        # For example, if a normal user X requests for a change by creating a ticket, the
        # stakeholders list will be [X, WRT] (WRT is added as stakeholder because WRT is
        # responsible for taking action on the ticket). If a WRT member fetches the ticket data,
        # the value of requester_stakeholders will be [WRT] and if the normal user fetches the
        # ticket data, the value of requester_stakeholders will be [X]. If the ticket is created by
        # a WRT member, then the value requester_stakeholders will be [X, WRT] because the user can
        # be any of the two stakeholders.
        requester_stakeholders = ticket.user_stakeholders(current_user)

        # Currently only stakeholders can access the ticket.
        return head :unauthorized if requester_stakeholders.empty?

        render json: {
          ticket: ticket,
          requester_stakeholders: requester_stakeholders,
        }
      end
    end
  end

  def update_status
    ticket = Ticket.find(params.require(:ticket_id))
    ticket_status = params.require(:ticket_status)

    return head :unauthorized unless ticket.action_allowed?(:update_status, current_user)

    ActiveRecord::Base.transaction do
      ticket.metadata.update!(status: ticket_status)
      TicketLog.create!(
        ticket_id: ticket.id,
        log: "Ticket status changed to #{ticket_status} by #{current_user.name}.",
      )
    end
    render json: { success: true }
  end
end
