# frozen_string_literal: true

class TicketsCompetitionResult < ApplicationRecord
  self.table_name = "tickets_competition_result"

  enum :status, {
    pending_import: "pending_import",
    submitted: "submitted",
    locked_for_posting: "locked_for_posting",
    warnings_verified: "warnings_verified",
    posted: "posted",
  }, default: :pending_import

  has_one :ticket, as: :metadata
  has_one :competition_stakeholder, -> { where(stakeholder_type: "Competition") }, through: :ticket, source: :ticket_stakeholders, primary_key: :stakeholder_id, foreign_key: :competition_id
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

  def self.create_ticket!(competition, user_id)
    ActiveRecord::Base.transaction do
      ticket_metadata = self.create!(competition: competition)

      ticket = Ticket.create!(metadata: ticket_metadata)

      competition_stakeholder = ticket.ticket_stakeholders.create!(
        stakeholder: competition,
        connection: TicketStakeholder.connections[:assigned],
        stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
        is_active: true,
      )

      ticket.ticket_logs.create!(
        action_type: TicketLog.action_types[:create_ticket],
        acting_user_id: user_id,
        acting_stakeholder_id: competition_stakeholder.id,
      )
    end
  end
end
