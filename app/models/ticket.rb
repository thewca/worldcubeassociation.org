# frozen_string_literal: true

class Ticket < ApplicationRecord
  enum :ticket_type, {
    edit_person: "edit_person",
  }

  has_many :ticket_logs
  has_many :ticket_stakeholders
  belongs_to :metadata, polymorphic: true

  def user_stakeholders(user)
    return [] if user.nil?
    ticket_stakeholders.select do |stakeholder|
      if stakeholder.stakeholder_type == :user
        stakeholder.stakeholder_id == user.id
      elsif stakeholder.stakeholder_type == TicketStakeholder.stakeholder_types[:user_group]
        user.active_roles.any? { |role| role.group_id == stakeholder.stakeholder_id }
      end
    end
  end

  def action_allowed?(action, user)
    user_stakeholders(user).any? do |stakeholder|
      (
        stakeholder.stakeholder_type == TicketStakeholder.stakeholder_types[:user_group] &&
        metadata.action_user_groups(action).include?(stakeholder.stakeholder_id)
      )
    end
  end

  def url
    Rails.application.routes.url_helpers.ticket_url(id)
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
