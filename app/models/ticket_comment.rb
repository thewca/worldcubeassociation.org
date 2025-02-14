# frozen_string_literal: true

class TicketComment < ApplicationRecord
  belongs_to :ticket
  belongs_to :acting_user, class_name: 'User', foreign_key: :acting_user_id

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[acting_user],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
