# frozen_string_literal: true

class Ticket < ApplicationRecord
  TICKET_TYPES = {
    edit_person: "TicketsEditPerson",
  }.freeze

  has_many :ticket_logs
  has_many :ticket_stakeholders
  belongs_to :metadata, polymorphic: true

  def user_stakeholders(user)
    return [] if user.nil?
    ticket_stakeholders.select do |ticket_stakeholder|
      user.active_roles.where(group: ticket_stakeholder.stakeholder).any? || user == ticket_stakeholder.stakeholder
    end
  end

  def action_allowed?(action, user)
    user_stakeholders(user).any? do |ticket_stakeholder|
      metadata.action_user_groups(action).include?(ticket_stakeholder.stakeholder)
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[ticket_logs metadata],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
