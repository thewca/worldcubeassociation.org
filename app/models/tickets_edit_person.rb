# frozen_string_literal: true

class TicketsEditPerson < ApplicationRecord
  self.table_name = "tickets_edit_person"

  enum :status, {
    open: "open",
    closed: "closed",
  }

  has_one :ticket, as: :metadata

  def action_user_groups(action)
    case action
    when :update_status
      [UserGroup.teams_committees_group_wrt.id]
    end
  end

  def self.create_ticket(wca_id, changes_requested, requester)
    ActiveRecord::Base.transaction do
      ticket_metadata = TicketsEditPerson.create!(
        status: TicketsEditPerson.statuses[:open],
        wca_id: wca_id,
      )

      changes_requested.each do |change|
        case change[:field]
        when :name
          ticket_metadata.update!(
            previous_name: change[:from],
            new_name: change[:to],
          )
        when :country_iso2
          ticket_metadata.update!(
            previous_country_iso2: change[:from],
            new_country_iso2: change[:to],
          )
        when :gender
          ticket_metadata.update!(
            previous_gender: change[:from],
            new_gender: change[:to],
          )
        when :dob
          ticket_metadata.update!(
            previous_dob: change[:from],
            new_dob: change[:to],
          )
        end
      end

      ticket = Ticket.create!(
        name: "Edit Profile request by #{wca_id}",
        ticket_type: Ticket.ticket_types[:edit_person],
        metadata: ticket_metadata,
      )

      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder_id: UserGroup.teams_committees_group_wrt.id,
        stakeholder_type: TicketStakeholder.stakeholder_types[:user_group],
        connection: TicketStakeholder.connections[:assigned],
        is_active: true,
      )
      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder_id: requester.id,
        stakeholder_type: TicketStakeholder.stakeholder_types[:user],
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
