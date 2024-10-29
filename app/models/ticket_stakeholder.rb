# frozen_string_literal: true

class TicketStakeholder < ApplicationRecord
  enum :stakeholder_type, {
    user: "user",
    user_group: "user_group",
  }

  enum :connection, {
    assigned: "assigned",
    cc: "cc",
  }

  belongs_to :ticket

  def stakeholder
    if stakeholder_type == TicketStakeholder.stakeholder_types[:user_group]
      UserGroup.find(stakeholder_id)
    elsif stakeholder_type == TicketStakeholder.stakeholder_types[:user]
      User.find(stakeholder_id)
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[stakeholder],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
