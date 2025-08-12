# frozen_string_literal: true

class TicketsCompetitionResult < ApplicationRecord
  self.table_name = "tickets_competition_result"

  enum :status, {
    submitted: "submitted",
    locked_for_posting: "locked_for_posting",
    warnings_verified: "warnings_verified",
    merged_inbox_results: "merged_inbox_results",
    created_wca_ids: "created_wca_ids",
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

    ticket_log = ticket.ticket_logs.create!(
      action_type: TicketLog.action_types[:update_status],
      acting_user_id: submitted_delegate.id,
      acting_stakeholder_id: competition_stakeholder.id,
    )
    ticket_log.ticket_log_changes.create!(
      field_name: TicketLogChange.field_names[:status],
      field_value: ticket_metadata.status,
    )
  end

  def merge_inbox_results
    ActiveRecord::Base.transaction do
      CompetitionResultsImport.merge_inbox_results(competition)

      self.update!(status: TicketsCompetitionResult.statuses[:merged_inbox_results])
    end
  end
end
