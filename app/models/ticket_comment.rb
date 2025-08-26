# frozen_string_literal: true

class TicketComment < ApplicationRecord
  belongs_to :ticket
  belongs_to :acting_user, class_name: 'User'
  belongs_to :acting_stakeholder, class_name: 'TicketStakeholder'

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[acting_user],
  }.freeze

  private def stakeholder_emails_to_notify
    stakeholders = ticket.ticket_stakeholders.includes(:stakeholder)

    stakeholders = stakeholders.reject { |stakeholder| stakeholder.id == acting_stakeholder_id } if acting_stakeholder.user_stakeholder?

    stakeholders.flat_map(&:emails)
  end

  after_create :notify_stakeholders
  private def notify_stakeholders
    recipient_emails = stakeholder_emails_to_notify

    TicketsMailer.notify_create_ticket_comment(self, recipient_emails).deliver_now # TODO: Change to deliver_later
  end

  def author_text
    if acting_stakeholder.user_group_stakeholder?
      "#{acting_user.name} (#{acting_stakeholder.stakeholder.name})"
    else
      acting_user.name
    end
  end

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
