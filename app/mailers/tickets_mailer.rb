# frozen_string_literal: true

class TicketsMailer < ApplicationMailer
  def notify_create_ticket_comment(ticket_comment, recipient_emails)
    @ticket_comment = ticket_comment

    mail(
      bcc: recipient_emails,
      subject: "[Ticket #{ticket_comment.ticket.id}] New comment added",
    )
  end
end
