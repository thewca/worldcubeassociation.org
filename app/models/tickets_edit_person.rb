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

      ticket = Ticket.create!(metadata: ticket_metadata)

      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: UserGroup.teams_committees_group_wrt,
        connection: TicketStakeholder.connections[:assigned],
        is_active: true,
      )
      requester_stakeholder = TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: requester,
        connection: TicketStakeholder.connections[:cc],
        is_active: true,
      )

      TicketLog.create!(
        ticket_id: ticket.id,
        action_type: TicketLog.action_types[:status_updated],
        action_value: TicketsEditPerson.statuses[:open],
        acting_user_id: requester.id,
        acting_stakeholder_id: requester_stakeholder.id,
      )

      return ticket
    end
  end
end
