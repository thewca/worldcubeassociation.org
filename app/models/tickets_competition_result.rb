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
  belongs_to :competition

  def actions_allowed_for(ticket_stakeholder)
    if ticket_stakeholder.stakeholder == UserGroup.teams_committees_group_wrt
      actions = [TicketLog.action_types[:create_comment]]
      actions << TicketLog.action_types[:update_status] unless posted?
      actions
    else
      []
    end
  end

  def self.create_ticket!(competition, delegate_message, submitted_delegate)
    ticket_metadata = TicketsCompetitionResult.create!(
      status: TicketsCompetitionResult.statuses[:submitted],
      competition_id: competition.id,
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

    competition_stakeholder = TicketStakeholder.create!(
      ticket_id: ticket.id,
      stakeholder: competition,
      connection: TicketStakeholder.connections[:cc],
      stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
      is_active: true,
    )

    TicketLog.create!(
      ticket_id: ticket.id,
      action_type: TicketLog.action_types[:update_status],
      action_value: ticket_metadata.status,
      acting_user_id: submitted_delegate.id,
      acting_stakeholder_id: competition_stakeholder.id,
    )
  end
end
