# frozen_string_literal: true

class TicketStakeholdersController < ApplicationController
  before_action :authenticate_user!

  def create
    ticket = Ticket.find(params.require(:ticket_id))
    connection = params.require(:connection)
    stakeholder_role = params.require(:stakeholderRole)
    is_active = ActiveRecord::Type::Boolean.new.cast(params.require(:isActive))

    return head :unauthorized unless ticket.metadata.eligible_roles_for_bcc(current_user).include?(stakeholder_role)

    stakeholder = TicketStakeholder.create!(
      ticket_id: ticket.id,
      stakeholder: current_user,
      connection: connection,
      stakeholder_role: stakeholder_role,
      is_active: is_active,
    )

    render json: stakeholder
  end
end
