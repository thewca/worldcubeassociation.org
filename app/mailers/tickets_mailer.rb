# frozen_string_literal: true

class TicketsMailer < ApplicationMailer
  def notify_create_ticket_comment(ticket_comment, stakeholder)
    @recipient_name = stakeholder.name
    @ticket_id = ticket_comment.ticket.id
    @ticket_comment = ticket_comment

    mail(
      to: [stakeholder.email],
      subject: "[Ticket #{ticket_comment.ticket.id}] New comment added",
    )
  end
end
