# frozen_string_literal: true

class TicketComment < ApplicationRecord
  belongs_to :ticket
  belongs_to :acting_user, class_name: 'User'
  belongs_to :acting_stakeholder, class_name: 'TicketStakeholder'

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[acting_user],
  }.freeze

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
