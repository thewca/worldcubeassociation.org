# frozen_string_literal: true

class TicketLogsController < ApplicationController
  before_action :authenticate_user!

  def index
    ticket = Ticket.find(params.require(:ticket_id))

    # Currently only stakeholders can access the ticket logs.
    return head :unauthorized unless ticket.can_user_access?(current_user)

    logs = ticket.ticket_logs.order(created_at: :desc)
    render json: logs
  end
end
