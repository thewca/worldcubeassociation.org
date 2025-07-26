# frozen_string_literal: true

class TicketLog < ApplicationRecord
  enum :action_type, {
    create_ticket: "create_ticket",
    update_status: "update_status",
    create_comment: "create_comment",
  }
  belongs_to :ticket
  has_many :ticket_log_changes, dependent: :destroy

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[ticket_log_changes],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
