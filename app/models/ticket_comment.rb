# frozen_string_literal: true

class TicketComment < ApplicationRecord
  belongs_to :ticket
  belongs_to :acting_user, class_name: 'User'
  belongs_to :acting_stakeholder, class_name: 'TicketStakeholder'

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[acting_user],
  }.freeze

  private def stakeholders_to_email_notify
    stakeholders = ticket.ticket_stakeholders.includes(:stakeholder)

    if acting_stakeholder.user_stakeholder?
      stakeholders = stakeholders.reject { |stakeholder| stakeholder.id == acting_stakeholder_id }
    end

    stakeholders.map(&:stakeholder)
  end

  after_create :notify_stakeholders
  private def notify_stakeholders
    recipient_emails = stakeholders_to_email_notify.map(&:email)

    TicketsMailer.notify_create_ticket_comment(self, recipient_emails).deliver_later
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
