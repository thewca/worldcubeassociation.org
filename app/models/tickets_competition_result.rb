# frozen_string_literal: true

class TicketsCompetitionResult < ApplicationRecord
  self.table_name = "tickets_competition_result"

  enum :status, {
    submitted: "submitted",
    warnings_verification: "warnings_verification",
    results_verification: "results_verification",
    posted: "posted",
  }

  has_one :ticket, as: :metadata

  def action_user_groups(action)
    case action
    when :update_status
      [UserGroup.teams_committees_group_wrt]
    end
  end

  def self.create_ticket!(competition_id, delegate_message, submitted_delegate)
    ticket_metadata = TicketsCompetitionResult.create!(
      status: TicketsCompetitionResult.statuses[:submitted],
      competition_id: competition_id,
      delegate_message: delegate_message,
    )

    ticket = Ticket.create!(metadata: ticket_metadata)

    TicketStakeholder.create!(
      ticket_id: ticket.id,
      stakeholder: UserGroup.teams_committees_group_wrt,
      connection: TicketStakeholder.connections[:assigned],
      stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
      is_active: true,
    )

    submitted_delegate_stakeholder = TicketStakeholder.create!(
      ticket_id: ticket.id,
      stakeholder: submitted_delegate,
      connection: TicketStakeholder.connections[:cc],
      stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
      is_active: true,
    )

    TicketLog.create!(
      ticket_id: ticket.id,
      action_type: TicketLog.action_types[:status_updated],
      action_value: ticket_metadata.status,
      acting_user_id: submitted_delegate.id,
      acting_stakeholder_id: submitted_delegate_stakeholder.id,
    )
  end
end
