# frozen_string_literal: true

class TicketsEditPerson < ApplicationRecord
  self.table_name = "tickets_edit_person"

  enum :status, {
    open: "open",
    closed: "closed",
  }

  has_one :ticket, as: :metadata
  has_many :tickets_edit_person_fields

  def action_user_groups(action)
    case action
    when :update_status
      [UserGroup.teams_committees_group_wrt]
    end
  end

  def self.create_ticket(wca_id, changes_requested, requester)
    ActiveRecord::Base.transaction do
      ticket_metadata = TicketsEditPerson.create!(
        status: TicketsEditPerson.statuses[:open],
        wca_id: wca_id,
      )

      changes_requested.each do |change|
        TicketsEditPersonField.create!(
          tickets_edit_person_id: ticket_metadata.id,
          field_name: TicketsEditPersonField.field_names[change[:field]],
          old_value: change[:from],
          new_value: change[:to],
        )
      end

      ticket = Ticket.create!(
        ticket_type: Ticket.ticket_types[:edit_person],
        metadata: ticket_metadata,
      )

      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: UserGroup.teams_committees_group_wrt,
        connection: TicketStakeholder.connections[:assigned],
        is_active: true,
      )
      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: requester,
        connection: TicketStakeholder.connections[:cc],
        is_active: true,
      )

      TicketLog.create!(
        ticket_id: ticket.id,
        log: "Ticket created.",
      )

      return ticket
    end
  end
end
