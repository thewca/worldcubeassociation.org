# frozen_string_literal: true

class TicketStakeholder < ApplicationRecord
  enum :connection, {
    assigned: "assigned",
    cc: "cc",
  }

  enum :stakeholder_role, {
    actioner: "actioner",
    requester: "requester",
  }

  belongs_to :ticket
  belongs_to :stakeholder, polymorphic: true

  scope :belongs_to_user, lambda { |user_id|
    where(stakeholder_type: "User", stakeholder_id: user_id)
  }

  scope :belongs_to_groups, lambda { |group_ids|
    where(stakeholder_type: "UserGroup", stakeholder_id: group_ids)
  }

  def user_group_stakeholder?
    stakeholder_type == "UserGroup"
  end

  def user_stakeholder?
    stakeholder_type == "User"
  end

  def actions_allowed
    ticket.metadata.actions_allowed(self)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[stakeholder actions_allowed],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
