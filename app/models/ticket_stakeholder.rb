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

  scope :belongs_to_competitions, lambda { |competition_ids|
    where(stakeholder_type: "Competition", stakeholder_id: competition_ids)
  }

  def user_group_stakeholder?
    stakeholder_type == "UserGroup"
  end

  def user_stakeholder?
    stakeholder_type == "User"
  end

  def competition_stakeholder?
    stakeholder_type == "Competition"
  end

  def emails
    if competition_stakeholder?
      stakeholder.delegates.pluck(:email)
    else
      [stakeholder.email]
    end
  end

  def metadata_actions_allowed
    ticket.metadata.metadata_actions_allowed_for(self)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[stakeholder],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
