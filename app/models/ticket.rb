# frozen_string_literal: true

class Ticket < ApplicationRecord
  TICKET_TYPES = {
    edit_person: "TicketsEditPerson",
    competition_result: "TicketsCompetitionResult",
  }.freeze

  has_many :ticket_comments
  has_many :ticket_logs
  has_many :ticket_stakeholders
  belongs_to :metadata, polymorphic: true

  # user_stakeholders will have the list of stakeholders where the user is part of. For example,
  # if a normal user X requests for a change by creating a ticket, the stakeholders list will be
  # [X, WRT] (WRT is added as stakeholder because WRT is responsible for taking action on the
  # ticket). If a WRT member fetches the ticket data, the value of user_stakeholders will be [WRT]
  # and if the normal user fetches the ticket data, the value of user_stakeholders will be [X]. If
  # the ticket is created by a WRT member, then the value user_stakeholders will be [X, WRT] because
  # the user can be any of the two stakeholders.
  def user_stakeholders(user)
    return [] if user.nil?

    ticket_stakeholders.belongs_to_user(user)
                       .or(ticket_stakeholders.belongs_to_groups(user.active_groups))
                       .or(ticket_stakeholders.belongs_to_competitions(user.delegated_competitions))
  end

  def can_user_access?(user)
    return false if user.nil?

    ticket_stakeholders.belongs_to_user(user).any? ||
      ticket_stakeholders.belongs_to_groups(user.active_groups).any?
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[metadata],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
