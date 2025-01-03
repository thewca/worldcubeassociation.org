# frozen_string_literal: true

class TicketStakeholder < ApplicationRecord
  enum :connection, {
    assigned: "assigned",
    cc: "cc",
  }

  belongs_to :ticket
  belongs_to :stakeholder, polymorphic: true

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[stakeholder],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
